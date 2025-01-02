import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error('Missing GOOGLE_GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Context for the chatbot
const context = `
Eres un asistente virtual de Capital Code, experto en desarrollo de software y sitios web.
Sé amigable y profesional, responde saludos pero mantén el foco en nuestros servicios.

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
1. Responde saludos brevemente
2. Enfócate en servicios de Capital Code
3. Sugiere WhatsApp para atención inmediata
4. Recomienda agendar llamada para consultas detalladas
5. Usa español profesional y directo
6. Evita temas no relacionados con tecnología

Ejemplos:
Saludo: Hola, bienvenido a Capital Code. ¿En qué proyecto puedo ayudarte?
Consulta: Entiendo tu necesidad. Escríbenos por WhatsApp o agenda una llamada en el menú superior.
Precios: Para un presupuesto preciso, contáctanos por WhatsApp o agenda una llamada.
`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
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
          parts: [{ text: "Entendido. Actuaré como el asistente virtual de Capital Code, ayudando a los clientes en español y siguiendo las pautas establecidas." }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { 
        error: 'Error en el servicio de chat',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
