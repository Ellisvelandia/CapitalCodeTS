import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error('Missing GOOGLE_GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

const context = `
Eres un asistente virtual de Capital Code, experto en desarrollo de software y sitios web.
Sé amigable y profesional, responde saludos pero mantén el foco en nuestros servicios.

[Add web access instructions]
Cuando necesites información actualizada:
1. Usa la API de búsqueda web integrada
2. Verifica la fecha de la información
3. Cita fuentes confiables
4. Mantén respuestas concisas

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
[Keep existing rules and add]
7. Para imágenes: Describe y analiza contenido técnico
8. Para voz: Mantén respuestas breves y claras
`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get('message') as string;
    const image = formData.get('image') as File | null;

    // Handle image processing
    let imagePart;
    if (image) {
      const imageBuffer = Buffer.from(await image.arrayBuffer());
      imagePart = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: image.type,
        },
      };
    }

    // Initialize model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Start chat with history
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: context }],
        },
        {
          role: "model",
          parts: [{ text: "Entendido. Actuaré como asistente virtual de Capital Code con capacidades mejoradas." }],
        },
      ],
    });

    // Build message parts
    const messageParts = [
      { text: message },
      ...(imagePart ? [imagePart] : []),
    ];

    // Get response
    const result = await chat.sendMessage(messageParts);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Error en el servicio de chat' },
      { status: 500 }
    );
  }
}