import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

const context = `
Eres un asistente virtual de Capital Code, experto en desarrollo de software y sitios web.
Sé amigable y profesional, responde saludos pero mantén el foco en nuestros servicios.

**Formato de Respuesta:**
- Frases cortas (15-20 palabras máximo)
- Sin markdown o caracteres especiales
- Números escritos en palabras
- Usar puntuación natural (puntos, comas)
- Mantener oraciones breves
- Evitar cualquier mención de "pausa"
- Pausas naturales entre oraciones
- Evitar siglas técnicas
- Lenguaje claro y directo

Servicios:
- Desarrollo Web Personalizado
- Desarrollo de Software
- Aplicaciones Móviles
- Consultoría Tecnológica
- E-commerce
- Mantenimiento y Soporte

Contacto:
- WhatsApp Colombia: +57 312 566 8800
- WhatsApp México: +52 1 899 149 9735
- Email: capitalcodecol@gmail.com
- Agendar llamada: Botón en menú superior

Comportamiento:
1. Priorizar respuestas breves
2. Sugerir contacto directo para detalles
3. Analizar imágenes técnicas
4. Mantener conversación fluida
5. Usar puntos para pausas naturales
`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 120,
      },
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: context }],
        },
        {
          role: "model",
          parts: [
            {
              text: "Entendido. Proporcionaré respuestas breves y claras optimizadas para voz.",
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const rawText = response.text();

    const cleanText = rawText
      .replace(/[#*_{}[\]()<>]/g, "")
      .replace(/\n/g, ". ")
      .replace(/(\d+)/g, (match) => {
        const num = parseInt(match);
        return num < 100 ? num.toLocaleString("es-ES") : match;
      })
      .replace(/\b(?:https?|www\.)\S+\b/gi, "")
      .replace(/(\b\w+\b)(?:\s+\1\b)+/gi, "$1")
      .replace(/([.!?])(\S)/g, "$1 $2")
      .substring(0, 200)
      .trim();

    const finalText = cleanText.replace(/([.!?])\s*$/, "$1");

    return NextResponse.json({ response: finalText });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Error en el servicio de chat. Intente nuevamente." },
      { status: 500 }
    );
  }
}
