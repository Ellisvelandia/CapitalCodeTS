// app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { buildChatbotPrompt } from '@/lib/chatbotPrompt';
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

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
  }
] as const;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Helper function to analyze user sentiment
const analyzeUserSentiment = (message: string): {
  isNegative: boolean;
  isDisinterested: boolean;
  isShortAnswer: boolean;
} => {
  const lowercaseMsg = message.toLowerCase();
  return {
    isNegative: lowercaseMsg.includes('no') || lowercaseMsg.includes('nada'),
    isDisinterested: lowercaseMsg.length <= 5 || lowercaseMsg.includes('en nada'),
    isShortAnswer: lowercaseMsg.length <= 10
  };
};

// Helper function to try different models
async function tryModel(message: string, conversationHistory: any[], modelConfig: typeof MODELS[number]) {
  try {
    console.log(`Attempting to use model: ${modelConfig.name}`);
    
    const sentiment = analyzeUserSentiment(message);
    let temperature = 0.7;
    let maxTokens = Math.min(1000, modelConfig.maxTokens);

    // Adjust model parameters based on user sentiment
    if (sentiment.isDisinterested) {
      temperature = 0.5; // More focused responses
      maxTokens = 100; // Shorter responses
    } else if (sentiment.isNegative) {
      temperature = 0.6; // Balanced responses
      maxTokens = 150; // Moderate length
    } else if (sentiment.isShortAnswer) {
      temperature = 0.7; // More creative
      maxTokens = 200; // Slightly longer
    }

    const prompt = buildChatbotPrompt(message, conversationHistory);
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: prompt,
        },
        { role: "user", content: message },
      ],
      model: modelConfig.name,
      temperature,
      max_tokens: maxTokens,
    });

    if (!chatCompletion.choices?.[0]?.message?.content) {
      throw new Error('No se recibió respuesta del servidor');
    }

    return chatCompletion.choices[0].message.content;
  } catch (error: any) {
    console.error(`Error with model ${modelConfig.name}:`, {
      error: error?.error || error,
      message: error?.message,
      status: error?.status,
      code: error?.error?.code
    });
    
    if (error?.error?.code === 'rate_limit_exceeded' || 
        (error?.message && error.message.toLowerCase().includes('rate limit'))) {
      throw error;
    }
    
    throw new Error(`Error with ${modelConfig.name}: ${error?.error?.message || error?.message || 'Unknown error'}`);
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY?.startsWith('gsk_')) {
      console.error('Invalid or missing GROQ API key');
      return NextResponse.json(
        { error: "Error de configuración: La clave API no es válida." },
        { status: 500 }
      );
    }

    const { message, conversationHistory = [] } = await req.json();
    
    if (!message) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío." },
        { status: 400 }
      );
    }

    // Try models in order of priority
    for (const model of MODELS) {
      try {
        const response = await tryModel(message, conversationHistory, model);
        return NextResponse.json({ 
          response,
          model: model.name 
        });
      } catch (error: any) {
        console.log(`Retrying with next model due to error: ${error.message}`);
        if (model === MODELS[MODELS.length - 1]) {
          throw error;
        }
        continue;
      }
    }

    return NextResponse.json(
      { error: "Lo siento, estoy experimentando dificultades técnicas. Por favor, intenta de nuevo en unos momentos." },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: "Hubo un error procesando tu mensaje. Por favor, intenta de nuevo." },
      { status: 500 }
    );
  }
}
