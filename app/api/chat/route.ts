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

// Helper function to sanitize text
const sanitizeText = (text: string): string => {
  return text
    .replace(/[^\p{L}\p{N}\s.,¿?¡!()]/gu, '')  // Only allow letters, numbers, spaces, and basic punctuation
    .replace(/\s+/g, ' ')                       // Replace multiple spaces with single space
    .trim();
};

// Helper function to clean text for display
const cleanTextForDisplay = (text: string): string => {
  const cleaned = text
    .replace(/[^\p{L}\p{N}\s.,¿?¡!()[\]]/gu, '') // Allow markdown characters for links
    .replace(/\s+/g, ' ')
    .trim();
  
  // If the text is empty after cleaning, return a friendly message
  return cleaned || "Lo siento, no pude entender el mensaje. ¿Podrías reformularlo?";
};

// Helper function to generate navigation suggestions
const generateNavigationSuggestion = (message: string): string => {
  const lowercaseMsg = sanitizeText(message.toLowerCase());
  let suggestion = '';

  if (lowercaseMsg.includes('proyectos') || lowercaseMsg.includes('portafolio') || lowercaseMsg.includes('trabajos')) {
    suggestion = 'Me encantaría mostrarte nuestro trabajo. 👉 [Aquí puedes ver todos nuestros proyectos](proyectos) 🎯';
  }
  
  if (lowercaseMsg.includes('reunión') || lowercaseMsg.includes('cita') || lowercaseMsg.includes('videollamada') || lowercaseMsg.includes('llamada')) {
    const meetingSuggestion = '¡Perfecto! Me alegra tu interés. 📅 [Aquí puedes agendar una llamada](llamada) 🤝';
    suggestion = suggestion ? `${suggestion}\n\n${meetingSuggestion}` : meetingSuggestion;
  }

  return suggestion;
};

/**
 * Represents a chat message in the conversation.
 * @interface Message
 * @property {string} content - The text content of the message
 * @property {MessageRole} role - The role of the message sender (system, user, or assistant)
 */
interface Message {
  content: string;
  role: 'system' | 'user' | 'assistant';
}

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY?.startsWith('gsk_')) {
      return NextResponse.json(
        { error: "API key no configurada correctamente" },
        { status: 500 }
      );
    }

    const body = await req.json();
    
    // Validate the messages array exists and has content
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "Formato de mensaje inválido" },
        { status: 400 }
      );
    }

    // Clean and validate all messages in the conversation
    const messages = body.messages.map((msg: Message) => ({
      ...msg,
      content: cleanTextForDisplay(msg.content)
    }));

    const lastMessage = messages[messages.length - 1]?.content;

    if (!lastMessage) {
      return NextResponse.json(
        { error: "Mensaje vacío" },
        { status: 400 }
      );
    }

    // Generate navigation suggestions if applicable
    const navigationSuggestion = generateNavigationSuggestion(lastMessage);

    // Build the prompt
    const prompt = buildChatbotPrompt(lastMessage, messages);

    // Get response from model
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: prompt },
        ...messages,
        ...(navigationSuggestion ? [{ 
          role: "assistant", 
          content: navigationSuggestion 
        }] : [])
      ],
      model: MODELS[0].name,
      temperature: 0.7,
      max_tokens: Math.min(MODELS[0].maxTokens, 2048),
    });

    let response = completion.choices[0]?.message?.content || "Lo siento, no pude procesar tu solicitud.";

    // Clean the response text while preserving markdown links
    response = cleanTextForDisplay(response);

    // If the model didn't use our navigation suggestion, we'll add it
    if (navigationSuggestion && !response.includes(navigationSuggestion)) {
      response = navigationSuggestion;
    }

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { 
        error: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
