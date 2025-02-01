import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/supabase";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

interface CustomerInfo {
  id: string;
  name?: string;
  email?: string;
}

type RequestBody = {
  message: string;
  conversationHistory?: ChatMessage[];
  customerInfo?: CustomerInfo;
};

type ResponseBody = {
  respuesta: string;
  metadata?: {
    detectedIntent: string;
    tokensUsed?: number;
    customerId?: string;
    responseTime?: number;
  };
  error?: string;
};

// Initialize Groq with your API key.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
Capital Code - Asistente Especializado:
- Usa la conversación previa para mantener contexto
- Respuestas directas (1-2 frases) a menos que se pida detalle
- Menciona plazos y rangos de precios si aplica
`.trim();

const INTENT_DETECTION_PROMPT = `
Clasifica la intención en: web, software, optimización o general.
Responde solo con la palabra clave en minúsculas.
`.trim();

/**
 * POST endpoint to process a chat message.
 *
 * This endpoint:
 * 1. Validates that the customer exists in Supabase.
 * 2. Uses Groq to detect the intent using a lightweight model ("mixtral-8x7b-32768").
 * 3. Generates the assistant's response using the new Meta Llama 3.3 model ("llama-3.3-70b-versatile").
 * 4. Saves the conversation (user and assistant messages) into the Supabase `conversations` table.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: RequestBody = await req.json();
    const { message, conversationHistory, customerInfo } = body;

    // Validate required customer info.
    if (!customerInfo?.id || !customerInfo.email) {
      return NextResponse.json(
        { respuesta: "Sesión inválida", error: "invalid_customer" },
        { status: 401 }
      );
    }

    // Verify that the customer exists in Supabase.
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("id, email")
      .eq("id", customerInfo.id)
      .eq("email", customerInfo.email)
      .maybeSingle();

    if (customerError || !customerData) {
      return NextResponse.json(
        { respuesta: "Cliente no encontrado", error: "customer_not_found" },
        { status: 404 }
      );
    }

    // Process the message in parallel:
    // 1. Detect intent using a lightweight model.
    // 2. Generate the assistant's response using the new Meta Llama 3.3 model.
    const [intent, groqResponse] = await Promise.all([
      detectIntent(message),
      processMessage(message, conversationHistory || []),
    ]);

    // Save the conversation in Supabase.
    const { error: conversationError } = await supabase
      .from("conversations")
      .insert([
        {
          customer_id: customerInfo.id,
          role: "user",
          content: message,
          message_metadata: { intent },
        },
        {
          customer_id: customerInfo.id,
          role: "assistant",
          content: groqResponse.choices[0].message.content,
          message_metadata: {
            intent,
            tokens_used: groqResponse.usage?.total_tokens,
          },
        },
      ]);

    if (conversationError) {
      console.error("Error saving conversation:", conversationError);
    }

    return NextResponse.json({
      respuesta: groqResponse.choices[0].message.content,
      metadata: {
        detectedIntent: intent,
        tokensUsed: groqResponse.usage?.total_tokens,
        customerId: customerInfo.id,
        responseTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        respuesta: "Error en el servicio. Contacta: capitalcodecol@gmail.com",
        error: "server_error",
      },
      { status: 500 }
    );
  }
}

async function detectIntent(message: string): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: INTENT_DETECTION_PROMPT },
        { role: "user", content: message },
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.1,
      max_tokens: 10,
    });
    return (
      response.choices[0]?.message?.content?.trim().toLowerCase() || "general"
    );
  } catch {
    return "general";
  }
}

async function processMessage(message: string, history: ChatMessage[]) {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message },
  ];

  return groq.chat.completions.create({
    messages,
    model: "llama-3.3-70b-versatile", // New model identifier
    temperature: 0.7,
    max_tokens: 300,
  });
}

// Specify that this route should run on the Edge runtime.
export const runtime = "edge";
