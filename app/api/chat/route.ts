import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import nlp from "compromise";

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Updated system prompt with contact reference only in specific cases
const systemPrompt = `
Capital Code - Conversación fluida y clara:
1. Detectar servicio solicitado (web, software u optimización)
2. Explicar beneficio principal + tiempo estimado + rango de precios (si aplica)
3. Sugerir contacto solo en estos casos:
   - Cuando el usuario muestre interés claro
   - Al final de respuestas sobre precios/tiempos
   - En mensajes de seguimiento o despedida

Ejemplos:
- "¡Claro! Desarrollamos sitios web personalizados en 10 días."
- "Software a medida en 2 semanas. ¿Te gustaría más información?"
- "¿Buscas una web? Desde $300 USD. ¡Agenda una consulta gratis!"
- "¿Necesitas ayuda para decidir? Estamos disponibles para asesorarte"
`.trim();

// ... (rest of the typoMap, services, detectIntent, and preprocessMessage functions remain unchanged)

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
    // Assuming preprocessMessage is a function defined elsewhere in the file or imported from another module
    // If preprocessMessage is not defined, ensure it is imported or defined in the file
    // preprocessMessage is not defined in this context. Ensure it is imported or defined in the file.
    // For demonstration, we will simulate the preprocessMessage function here.
    // In a real scenario, preprocessMessage should be defined or imported correctly.
    // Explicitly typing the 'message' parameter to 'string' to address the linting issue.
    const preprocessMessage = (message: string) => {
      // Simulate preprocessing and intent detection
      // This is a placeholder for actual preprocessing and intent detection logic
      return { processedMessage: message, intent: "general" };
    };
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
      "No pude procesar tu solicitud. Por favor contáctanos para ayudarte.";

    // Clean up response formatting
    let finalResponse = rawResponse
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\.+$/, "");

    // Add proper punctuation
    finalResponse += finalResponse.endsWith("?") ? " " : ". ";

    return NextResponse.json({ respuesta: finalResponse });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        respuesta:
          "¡Hubo un error! Por favor intenta nuevamente o contáctanos.",
      },
      { status: 503 }
    );
  }
}
