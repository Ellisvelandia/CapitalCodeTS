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

// Define available models and their configurations
const MODELS = [
  {
    name: "llama-3.3-70b-versatile",
    maxTokens: 32768,
    priority: 1
  },
  {
    name: "mixtral-8x7b-32768",
    maxTokens: 32768,
    priority: 2
  },
  {
    name: "llama-3.1-8b-instant",
    maxTokens: 8192,
    priority: 3
  },
  {
    name: "llama-guard-3-8b",
    maxTokens: 8192,
    priority: 4
  }
] as const;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Groq client with API key from environment variable
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''  // Add fallback to empty string
});

// Helper function to try different models
async function tryModel(message: string, prompt: string, modelConfig: typeof MODELS[number]) {
  try {
    console.log(`Attempting to use model: ${modelConfig.name}`);
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres un asistente amigable y conocedor. Usa el siguiente contexto para responder la pregunta del usuario en un tono conversacional.\n\nContexto:\n${prompt}`,
        },
        { role: "user", content: message },
      ],
      model: modelConfig.name,
      temperature: 0.7,
      max_tokens: Math.min(1000, modelConfig.maxTokens),
    });

    if (!chatCompletion.choices?.[0]?.message?.content) {
      throw new Error('No response content from API');
    }

    return chatCompletion.choices[0].message.content;
  } catch (error: any) {
    console.error(`Error with model ${modelConfig.name}:`, {
      error: error?.error || error,
      message: error?.message,
      status: error?.status,
      code: error?.error?.code
    });
    
    // Check if it's a rate limit error
    if (error?.error?.code === 'rate_limit_exceeded' || 
        (error?.message && error.message.toLowerCase().includes('rate limit'))) {
      throw error; // Re-throw rate limit errors to try next model
    }
    
    // For other errors, throw with more context
    throw new Error(`Error with ${modelConfig.name}: ${error?.error?.message || error?.message || 'Unknown error'}`);
  }
}

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

    // Try models in order of priority until one works
    let lastError = null;
    let attemptedModels = [];
    
    for (const model of MODELS) {
      try {
        console.log(`Trying model ${model.name}...`);
        attemptedModels.push(model.name);
        
        const response = await tryModel(message, prompt, model);
        console.log(`Successfully used model: ${model.name}`);
        return NextResponse.json({ 
          response,
          model: model.name // Include which model was used
        });
      } catch (error: any) {
        lastError = error;
        const isRateLimit = error?.error?.code === 'rate_limit_exceeded' || 
                          (error?.message && error.message.toLowerCase().includes('rate limit'));
        
        if (!isRateLimit) {
          console.error(`Non-rate-limit error with ${model.name}:`, error);
          break; // If it's not a rate limit error, stop trying other models
        }
        console.warn(`Rate limit reached for model ${model.name}, trying next model...`);
      }
    }

    // If we get here, all models failed
    console.error("All models failed. Attempted models:", attemptedModels, "Last error:", lastError);
    
    // Provide more detailed error message
    const errorMessage = lastError?.error?.message || lastError?.message || "Unknown error";
    const errorDetails = {
      message: errorMessage,
      attemptedModels,
      lastModelTried: attemptedModels[attemptedModels.length - 1],
      isRateLimit: lastError?.error?.code === 'rate_limit_exceeded'
    };

    return NextResponse.json(
      { 
        error: "Error del servidor: Todos los modelos están temporalmente no disponibles. Por favor, intente nuevamente en unos minutos.",
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        error: "Error del servidor: " + (error.message || "No se pudo generar una respuesta."),
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  }
}
