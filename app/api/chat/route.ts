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

// Initialize Groq client with API key from environment variable
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''  // Add fallback to empty string
});

export async function POST(req: Request) {
  try {
    // Verify API key exists and is in correct format
    if (!process.env.GROQ_API_KEY?.startsWith('gsk_')) {
      console.error('Invalid or missing GROQ API key');
      return NextResponse.json(
        { error: "Error de configuración: La clave API no es válida." },
        { status: 500 }
      );
    }

    // Get message from request body
    const { message } = await req.json();
    
    if (!message) {
      return NextResponse.json(
        { error: "El mensaje es requerido." },
        { status: 400 }
      );
    }

    // Build the prompt using the helper function
    const prompt = buildChatbotPrompt(message);

    // Generate chat completion
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres un asistente amigable y conocedor. Usa el siguiente contexto para responder la pregunta del usuario en un tono conversacional.\n\nContexto:\n${prompt}`,
        },
        { role: "user", content: message },
      ],
      model: "mixtral-8x7b-32768",  // Using a different model
      temperature: 0.7,
      max_tokens: 1000,
    });

    if (!chatCompletion.choices?.[0]?.message?.content) {
      throw new Error('No response content from API');
    }

    return NextResponse.json({
      response: chatCompletion.choices[0].message.content,
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        error: "Error del servidor: " + (error.message || "No se pudo generar una respuesta."),
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}
