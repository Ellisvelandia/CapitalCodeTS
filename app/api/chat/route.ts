import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import nlp from "compromise";

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// System prompt with enhanced guidance for fluency
const systemPrompt = `
Capital Code - Conversación fluida y clara:
1. Detectar servicio solicitado (web, app móvil, software o optimización).
2. Explicar beneficio principal + tiempo estimado + rango de precios (si aplica).
3. Evitar respuestas no relacionadas con Capital Code o servicios digitales.


Ejemplos:
- "¡Claro! Desarrollamos sitios web personalizados en 10 días."
- "Software a medida en 2 semanas. Consultar detalles en WhatsApp:"
- "¿Buscas una web? Desde $300 USD. Escríbenos:"
- "¿No sabes qué necesitas? ¡Te ayudamos a decidir! Contáctanos: WhatsApp"
`.trim();

// Common typo corrections
const typoMap = {
  wueb: "web",
  nezecito: "necesito",
  apliacion: "aplicación",
  movil: "móvil",
};

// Service keywords for intent detection
const services = [
  "web",
  "sitio",
  "página",
  "app",
  "aplicación",
  "software",
  "mobile",
  "móvil",
  "optimización",
];

/**
 * Detects intent based on user input.
 * @param {string} text
 * @param {string} text
 * @returns {string} Detected intent or 'general' for ambiguous queries.
 */
function detectIntent(text: string): string {
  const doc = nlp(text);
  return services.find((service) => doc.has(service)) || "general";
}

/**
 * Processes the user input for typos and intent detection.
 * @param {string} message
 * @param {string} message
 * @returns {object} Processed message and detected intent.
 */
function preprocessMessage(message: string): { processedMessage: string; intent: string } {
  let processedMessage = message.trim().toLowerCase();
  Object.entries(typoMap).forEach(([typo, correction]) => {
    processedMessage = processedMessage.replace(
      new RegExp(typo, "g"),
      correction
    );
  });
  const intent = detectIntent(processedMessage);
  return { processedMessage, intent };
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid input. Please provide a valid message." },
        { status: 400 }
      );
    }

    // Preprocess message and detect intent
    const { processedMessage, intent } = preprocessMessage(message);

    // Query Groq API
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\n\nContexto: ${
            intent === "general"
              ? "El usuario no especificó un servicio claro."
              : `Posible servicio detectado: ${intent}.`
          }`,
        },
        { role: "user", content: processedMessage },
      ],
      model: "llama3-70b-8192",
      temperature: 0.3,
      max_tokens: 120,
      frequency_penalty: 0.5,
    });

    const rawResponse =
      response.choices?.[0]?.message?.content ||
      "No pude procesar tu solicitud. Contáctanos directamente en WhatsApp +57 312 566 8800.";

    // Ensure WhatsApp number is always included
    const phoneNumber = "+57 312 566 8800";
    let finalResponse = rawResponse.trim();
    if (!finalResponse.includes(phoneNumber)) {
      finalResponse += ` Contacto: WhatsApp ${phoneNumber}`;
    }

    // Ensure proper sentence formatting
    finalResponse = finalResponse.replace(/\.+$/, "") + ".";

    return NextResponse.json({ respuesta: finalResponse });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        respuesta:
          "¡Hubo un error! Contáctanos directamente en WhatsApp +57 312 566 8800.",
      },
      { status: 503 }
    );
  }
}
