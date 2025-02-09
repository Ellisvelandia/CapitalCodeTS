import { NextResponse } from "next/server";
import { buildChatbotPrompt } from "@/lib/chatbotPrompt";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

const MODELS = [
  {
    name: "llama-3.3-70b-versatile",
    maxTokens: 32768,
    priority: 1,
  },
  {
    name: "mixtral-8x7b-32768",
    maxTokens: 32768,
    priority: 2,
  },
  {
    name: "llama-3.1-8b-instant",
    maxTokens: 8192,
    priority: 3,
  },
] as const;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const analyzeUserSentiment = (message: string) => {
  const lowercaseMsg = message.toLowerCase();
  return {
    isNegative: lowercaseMsg.includes("no") || lowercaseMsg.includes("nada"),
    isDisinterested:
      lowercaseMsg.length <= 5 || lowercaseMsg.includes("en nada"),
    isShortAnswer: lowercaseMsg.length <= 10,
  };
};

async function tryModel(
  message: string,
  conversationHistory: any[],
  modelConfig: (typeof MODELS)[number]
) {
  try {
    const sentiment = analyzeUserSentiment(message);
    let temperature = 0.7;
    let maxTokens = Math.min(1000, modelConfig.maxTokens);

    if (sentiment.isDisinterested) {
      temperature = 0.5;
      maxTokens = 100;
    } else if (sentiment.isNegative) {
      temperature = 0.6;
      maxTokens = 150;
    } else if (sentiment.isShortAnswer) {
      temperature = 0.7;
      maxTokens = 200;
    }

    const prompt = buildChatbotPrompt(message, conversationHistory);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: message },
      ],
      model: modelConfig.name,
      temperature,
      max_tokens: maxTokens,
    });

    if (!chatCompletion.choices?.[0]?.message?.content) {
      throw new Error("No response from server");
    }

    return chatCompletion.choices[0].message.content;
  } catch (error: any) {
    const isRateLimit =
      error?.error?.code === "rate_limit_exceeded" ||
      error?.message?.includes("rate limit") ||
      error?.status === 429;

    if (isRateLimit) {
      const resetTime = error?.headers?.["retry-after"] || 5;
      throw {
        ...error,
        retryAfter: resetTime,
        isRateLimit: true,
      };
    }

    console.error(`Error with model ${modelConfig.name}:`, error);
    throw new Error(
      `Model error: ${
        error?.error?.message || error?.message || "Unknown error"
      }`
    );
  }
}

const sanitizeText = (text: string): string => {
  return text
    .replace(/[^\p{L}\p{N}\s.,¿?¡!()]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
};

const cleanTextForDisplay = (text: string): string => {
  const cleaned = text
    .replace(/[^\p{L}\p{N}\s.,¿?¡!()[\]]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  return (
    cleaned || "Lo siento, no pude entender el mensaje. ¿Podrías reformularlo?"
  );
};

const generateNavigationSuggestion = (message: string): string => {
  const lowercaseMsg = sanitizeText(message.toLowerCase());
  let suggestion = "";

  if (
    lowercaseMsg.includes("proyectos") ||
    lowercaseMsg.includes("portafolio") ||
    lowercaseMsg.includes("trabajos")
  ) {
    suggestion =
      "Me encantaría mostrarte nuestro trabajo. 👉 [Aquí puedes ver todos nuestros proyectos](proyectos) 🎯";
  }

  if (
    lowercaseMsg.includes("reunión") ||
    lowercaseMsg.includes("cita") ||
    lowercaseMsg.includes("videollamada") ||
    lowercaseMsg.includes("llamada")
  ) {
    const meetingSuggestion =
      "¡Perfecto! Me alegra tu interés. 📅 [Aquí puedes agendar una llamada](llamada) 🤝";
    suggestion = suggestion
      ? `${suggestion}\n\n${meetingSuggestion}`
      : meetingSuggestion;
  }

  return suggestion;
};

const detectLanguage = (text: string): string => {
  const spanishWords = [
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "y",
    "o",
    "pero",
    "porque",
    "qué",
    "cómo",
    "cuándo",
    "dónde",
  ];
  const words = text.toLowerCase().split(/\s+/);
  const spanishWordCount = words.filter((word) =>
    spanishWords.includes(word)
  ).length;

  return spanishWordCount > 0 ? "es-ES" : "en-US";
};

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY?.startsWith("gsk_")) {
      return NextResponse.json(
        { error: "API key no configurada correctamente" },
        { status: 500 }
      );
    }

    const body = await req.json();

    if (
      !body.messages ||
      !Array.isArray(body.messages) ||
      body.messages.length === 0
    ) {
      return NextResponse.json(
        { error: "Formato de mensaje inválido" },
        { status: 400 }
      );
    }

    const messages = body.messages.map((msg: any) => ({
      ...msg,
      content: cleanTextForDisplay(msg.content),
    }));

    const lastMessage = messages[messages.length - 1]?.content;

    if (!lastMessage) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    const navigationSuggestion = generateNavigationSuggestion(lastMessage);
    const prompt = buildChatbotPrompt(lastMessage, messages);
    let lastError: any = null;

    for (const modelConfig of [...MODELS].sort((a, b) => a.priority - b.priority)) {
      try {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const completion = await tryModel(
              lastMessage,
              messages,
              modelConfig
            );
            let response =
              completion || "Lo siento, no pude procesar tu solicitud.";
            response = cleanTextForDisplay(response);

            if (
              navigationSuggestion &&
              !response.includes(navigationSuggestion)
            ) {
              response = navigationSuggestion;
            }

            const language = detectLanguage(response);
            return NextResponse.json({ content: response, language });
          } catch (error: any) {
            if (error?.isRateLimit && attempt < maxRetries) {
              const waitTime =
                Math.pow(2, attempt) * 1000 + Math.random() * 1000;
              await delay(waitTime);
              continue;
            }
            throw error;
          }
        }
      } catch (error: any) {
        lastError = error;
        if (error?.isRateLimit) {
          continue;
        }
        break;
      }
    }

    throw lastError || new Error("All models failed to respond");
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      {
        error:
          "Lo siento, estamos experimentando alta demanda. Por favor, inténtalo de nuevo en 1-2 minutos.",
        details: error.message,
      },
      { status: error?.isRateLimit ? 429 : 500 }
    );
  }
}
