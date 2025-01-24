import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const systemPrompt = `
Eres el asistente virtual de Capital Code, empresa líder en desarrollo tecnológico con 4.9 estrellas y +200 reseñas. Tu función es guiar a los usuarios hacia nuestros servicios:

⭐️ **Servicios Principales:**
1. Desarrollo Web Personalizado
2. Software a Medida
3. Apps Móviles (iOS/Android)
4. Consultoría Tecnológica
5. E-commerce Integrado
6. Mantenimiento 24/7

**Reglas de Respuesta:**
1. Saludo inicial amable: "¡Hola! Soy tu asistente de Capital Code. ¿en qué te podemos ayudar hoy?"
2. Destacar beneficios clave:
   - Entregas en 1-2 semanas
   - Soluciones personalizadas
   - Precios asequibles
   - Soporte permanente
3. Hacer preguntas claras para identificar necesidades
4. Citar casos de éxito: "Para un cliente reciente creamos..."
5. Cierre con llamado a acción: "¿Quieres programar una reunión o necesitas más detalles?"
6. Contacto final: WhatsApp +57 312 566 8800

**Ejemplo de flujo:**
Usuario: "Quiero una web"
Respuesta: "¡Excelente elección! Desarrollamos sitios web con: 
- Diseño moderno 
- Funcionalidad avanzada 
- Optimización para dispositivos móviles 
¿Tienes ya algunos requisitos específicos o quieres agendar una consultoría gratuita?"
`.trim();

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    const respuesta = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: "llama3-70b-8192",
      temperature: 0.4,
      max_tokens: 500
    });

    const textoLimpio = respuesta?.choices[0]?.message?.content
      ?.replace(/\*\*/g, '') // Eliminar negritas
      ?.replace(/\n/g, ' '); // Unificar saltos

    return new NextResponse(JSON.stringify({
      respuesta: `${textoLimpio}\n\n💡 ¿Listo para comenzar? Contáctanos:\nWhatsApp: +57 312 566 8800\nEmail: capitalcodecol@gmail.com`
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    return new NextResponse(JSON.stringify({
      respuesta: "⚠️ Estamos experimentando alta demanda. Comunícate directamente:\n▶ WhatsApp: +57 312 566 8800\n▶ Email: capitalcodecol@gmail.com"
    }), { status: 503 });
  }
}