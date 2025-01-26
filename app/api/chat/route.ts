// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// ========== Type Definitions ==========
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  conversationHistory?: ChatMessage[];
}

interface ResponseBody {
  respuesta: string;
  metadata?: {
    detectedIntent: "web" | "software" | "optimización" | "general";
    tokensUsed?: number;
  };
  error?: string;
}

type IntentType = "web" | "software" | "optimización" | "general";

// ========== Groq Client Initialization ==========
if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY environment variable");
}
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ========== System Prompts & Configurations ==========
const SYSTEM_PROMPT = `
Capital Code - Asistente Especializado:
1. Respuestas directas (1-2 frases normalmente)
2. Explicaciones detalladas solo cuando se solicite explícitamente
3. Estructura: Beneficio principal + Tiempo estimado + Rango de precios (si aplica)
4. Evitar lenguaje redundante
5. Formato limpio sin markdown
6. Usar puntuación adecuada
7. Mantener tono profesional pero accesible
`.trim();

const INTENT_DETECTION_PROMPT = `
Clasifica la intención en: web, software, optimización o general.
Responde solo con la palabra clave en minúsculas.
`.trim();

const BASIC_QUESTIONS_HANDLING = {
  patterns: [
    /no\s+sé/i,
    /no\s+entendí/i,
    /no\s+entiendo/i,
    /no\s+estoy\s+seguro/i,
    /tal\s+vez/i,
    /quizás/i,
    /no\s+claro/i,
    /puedes\s+explicar/i,
    /más\s+detalles/i,
    /^\s*?\??\s*?$/i,
  ],
  responses: [
    "Desarrollo web: 10-14 días desde $800. ¿Necesitas más detalles?",
    "Software personalizado: Soluciones escalables en 3 semanas. ¿Qué necesitas exactamente?",
    "Optimización de sistemas: Mejoras de rendimiento en 5 días. ¿Te interesa saber más?",
    "¿Quieres comparar nuestros servicios principales? 1) Web 2) Software 3) Optimización",
    "¿Prefieres que hablemos por email? Escríbenos a hola@capitalcode.es",
  ],
};

// ========== Helper Functions ==========
async function detectIntent(userMessage: string): Promise<IntentType> {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: INTENT_DETECTION_PROMPT },
        { role: "user", content: userMessage },
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.2,
      max_tokens: 15,
    });

    const rawIntent =
      response.choices[0]?.message?.content?.trim().toLowerCase() || "general";
    return isValidIntent(rawIntent) ? rawIntent : "general";
  } catch (error) {
    console.error("Intent detection error:", error);
    return "general";
  }
}

function isValidIntent(intent: string): intent is IntentType {
  return ["web", "software", "optimización", "general"].includes(intent);
}

// Update the cleanResponse function
function cleanResponse(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold but keep text
    .replace(/\*(.*?)\*/g, "$1") // Remove italics
    .replace(/#{1,6}\s*/g, "") // Remove headers
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks (fixed regex)
    .replace(/(\r\n|\n|\r)/gm, " ") // Replace newlines
    .replace(/\s{2,}/g, " ") // Reduce spaces
    .replace(/(\w)\.(?=\w)/g, "$1") // Fix mid-sentence dots
    .replace(/([.!?])\s*/g, "$1 ") // Standardize punctuation spacing
    .trim();
}

function handleBasicQuestions(message: string): string | null {
  const trimmed = message.trim();

  // Handle ultra-short messages
  if (trimmed.length <= 2) {
    return "Por favor cuéntame más sobre tu proyecto para ayudarte mejor.";
  }

  // Match patterns
  if (BASIC_QUESTIONS_HANDLING.patterns.some((p) => p.test(trimmed))) {
    return BASIC_QUESTIONS_HANDLING.responses[
      Math.floor(Math.random() * BASIC_QUESTIONS_HANDLING.responses.length)
    ];
  }

  return null;
}

// ========== Main API Handler ==========
export async function POST(
  req: NextRequest
): Promise<NextResponse<ResponseBody>> {
  try {
    // Validate content type
    if (!req.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { respuesta: "Formato no compatible", error: "invalid_content_type" },
        { status: 415 }
      );
    }

    // Parse and validate request
    const body = (await req.json()) as RequestBody;
    const userMessage = body.message?.trim() || "";

    if (!userMessage) {
      return NextResponse.json(
        { respuesta: "Mensaje vacío recibido", error: "empty_message" },
        { status: 400 }
      );
    }

    // Handle basic questions first
    const basicResponse = handleBasicQuestions(userMessage);
    if (basicResponse) {
      return NextResponse.json({
        respuesta: basicResponse,
        metadata: { detectedIntent: "general", tokensUsed: 0 },
      });
    }

    // Process requests in parallel
    const [intent, groqResponse] = await Promise.all([
      detectIntent(userMessage),
      groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PROMPT}\nContexto: ${
              body.conversationHistory?.length
                ? "Conversación en curso"
                : "Nuevo contacto"
            }`,
          },
          ...(body.conversationHistory || []),
          { role: "user", content: userMessage },
        ],
        model: "llama3-70b-8192",
        temperature: 0.7,
        max_tokens: 100,
        frequency_penalty: 0.7,
      }),
    ]);

    // Process and clean response
    const rawResponse =
      groqResponse.choices[0]?.message?.content ||
      "¿Podrías reformular tu consulta? Quiero asegurarme de entenderte bien.";

    return NextResponse.json({
      respuesta: cleanResponse(rawResponse),
      metadata: {
        detectedIntent: intent,
        tokensUsed: groqResponse.usage?.total_tokens,
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      {
        respuesta:
          "Disponibilidad limitada - Por favor contáctanos directamente en hola@capitalcode.es",
        error: "service_unavailable",
      },
      { status: 503 }
    );
  }
}
