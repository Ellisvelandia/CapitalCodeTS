import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import nlp from "compromise";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `
Capital Code - Respuestas rápidas y precisas:
1. Identificar servicio (web, app móvil, software o optimización)
2. Mencionar beneficio principal + tiempo/opción de precio
3. Enviar enlace de contacto
4. Enviar enlace de WhatsApp con WhatsApp number

No respondas con información no relacionada con Capital Code.


Ejemplos:
- "¿Necesitas una web personalizada? Lista en 10 días."
- "Software a medida en 2 semanas. Consultar: ."
- "¡Optimizamos tu sitio web! Desde $300 USD. Contacta: ."
- "¿Necesitas ayuda para elegir? ¡Te asesoramos! WhatsApp: ."
- "¿Buscas solución digital? Desarrollamos web, app o software. Contáctanos: ."
`.trim();

const typoMap: { [key: string]: string } = {
  'wueb': 'web',
  'nezecito': 'necesito',
  'apliacion': 'aplicación',
  'movil': 'móvil'
};

function detectIntent(text: string): string {
  const doc = nlp(text);
  const services = ['web', 'sitio', 'página', 'app', 'aplicación', 'software', 'mobile', 'móvil', 'optimización'];
  return services.find(service => doc.has(service)) || 'general';
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    // Pre-procesamiento avanzado
    let processedMessage = message.trim().toLowerCase();
    
    // Corrección de typos
    Object.entries(typoMap).forEach(([typo, correction]) => {
      processedMessage = processedMessage.replace(new RegExp(typo, 'g'), correction);
    });

    // Detección de intención
    const intent = detectIntent(processedMessage);

    const res = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `${systemPrompt}\n\nContexto actual: ${intent === 'general' 
            ? 'El usuario no especificó un servicio claro' 
            : `Posible servicio detectado: ${intent}`}`
        },
        { role: "user", content: processedMessage }
      ],
      model: "llama3-70b-8192",
      temperature: 0.35,
      max_tokens: 120,
      frequency_penalty: 0.5,
    });

    const rawResponse = res.choices?.[0]?.message?.content || 
      "¿Necesitas ayuda con un proyecto digital? Escríbenos a WhatsApp +57 312 566 8800";
    
    // Validación de respuesta
    const phoneNumber = '+57 312 566 8800';
    let finalResponse = rawResponse.trim();
    
    if (!finalResponse.includes(phoneNumber)) {
      finalResponse += ` Contacto: WhatsApp ${phoneNumber}`;
    }

    // Formato final
    finalResponse = finalResponse.replace(/\.+$/, '') + '.';

    return NextResponse.json({ respuesta: finalResponse });

  } catch (error) {
    console.error("Error procesando solicitud:", error);
    return NextResponse.json(
      {
        respuesta: "¡Estamos mejorando nuestro servicio! Contáctanos directamente en WhatsApp +57 312 566 8800."
      },
      { status: 503 }
    );
  }
}