import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/supabase";
import { capitalCodeInfo } from "../data"; // Importing the data

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
- Proporciona información sobre los servicios, proyectos, garantías y el proceso de Capital Code.
- Responde de manera fluida y natural, utilizando la información de Capital Code.
- No uses respuestas predeterminadas; sé eficiente y autónomo.
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

    console.log("Incoming message:", message);

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

    // Generate a dynamic response using the processMessage function
    const response = await processMessage(message, conversationHistory || []);
    return NextResponse.json({
      respuesta: response.choices[0].message.content,
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

// Function to detect intent using Groq
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
    return response.choices[0]?.message?.content?.trim().toLowerCase() || "general";
  } catch {
    return "general";
  }
}

// Function to process the message and generate a response
async function processMessage(message: string, history: ChatMessage[]) {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message },
  ];

  // Check for keywords and provide direct responses
  if (message.toLowerCase().includes("servicios")) {
    return {
      choices: [{
        message: {
          content: `Ofrecemos los siguientes servicios:\n- ${capitalCodeInfo.services.map(service => `${service.title}: ${service.description}`).join('\n- ')}`,
        },
      }],
    };
  }

  if (message.toLowerCase().includes("proyectos")) {
    return {
      choices: [{
        message: {
          content: `Hemos completado más de ${capitalCodeInfo.projects.length} proyectos exitosos. Aquí hay algunos ejemplos:\n- ${capitalCodeInfo.projects.map(project => `${project.title}: ${project.description}`).join('\n- ')}`,
        },
      }],
    };
  }

  if (message.toLowerCase().includes("garantías")) {
    return {
      choices: [{
        message: {
          content: `Nuestras garantías incluyen:\n- ${capitalCodeInfo.guarantees.join('\n- ')}`,
        },
      }],
    };
  }

  // If the message does not match any keywords, return a message indicating no information is available
  return {
    choices: [{
      message: {
        content: "Lo siento, no tengo información sobre eso. Por favor, pregúntame sobre nuestros servicios, proyectos o garantías.",
      },
    }],
  };
}

// Specify that this route should run on the Edge runtime.
export const runtime = "edge";
