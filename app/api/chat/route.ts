// app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { buildChatbotPrompt } from '@/lib/chatbotPrompt'; // Import the new prompt builder
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

// Define types for WhatsApp numbers
interface WhatsAppNumber {
  country: string;
  number: string;
  flag: string;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Entrada inválida" }, { status: 400 });
    }

    // Build the final prompt for the AI using our helper
    const prompt = buildChatbotPrompt(message);

    // Call the Groq API with the constructed prompt
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres un asistente amigable y conocedor. Usa el siguiente contexto para responder la pregunta del usuario en un tono conversacional.\n\nContexto:\n${prompt}`,
        },
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
    });

    return NextResponse.json({
      response: chatCompletion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "No se pudo generar una respuesta." },
      { status: 500 }
    );
  }
}
