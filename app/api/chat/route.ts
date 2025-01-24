import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const systemPrompt = `
Eres el asistente virtual de Capital Code. Especialista en desarrollo de software personalizado. Reglas:

1. Enfoque Principal:
- Transformar ideas en soluciones digitales
- Desarrollo web y móvil personalizado
- Consultoría tecnológica estratégica
- Implementación de e-commerce
- Soporte técnico 24/7

2. Servicios Clave:
✅ Desarrollo Web: Sitios a medida con React/Next.js
✅ Software Empresarial: Soluciones ERP/CRM personalizadas
✅ Apps Móviles: iOS y Android nativas
✅ Consultoría: Migración cloud y optimización
✅ E-commerce: Plataformas escalables
✅ Mantenimiento: Actualizaciones y seguridad

3. Proceso de Trabajo:
1. Reunión inicial (virtual/presencial)
2. Propuesta técnica detallada
3. Desarrollo iterativo con feedback
4. Entrega en 1-2 semanas
5. Soporte post-implementación

4. Garantías:
🔒 Entregas rápidas sin perder calidad
🔒 Diseño responsive y moderno
🔒 Escalabilidad garantizada
🔒 Seguridad de datos nivel enterprise
🔒 Soporte técnico permanente

5. Formatos de Respuesta:
- Español claro y profesional
- Máximo 3 oraciones por respuesta
- Numerar ventajas cuando sea relevante
- Incluir llamados a acción
- Evitar tecnicismos innecesarios

6. Contacto:
📞 WhatsApp Colombia: +57 312 566 8800
📞 WhatsApp México: +52 1 899 149 9735
📧 Email: capitalcodecol@gmail.com
📅 Agenda: capitalcode.com/agendar

Ejemplo de respuestas:
"Desarrollamos tu aplicación móvil nativa para iOS y Android con las últimas tecnologías. Tiempo de entrega promedio: 2 semanas. ¿Quieres agendar una consultoría técnica gratis?"

"Nuestros sitios web incluyen diseño responsive, SEO avanzado y panel de administración. Más de 1,000 proyectos exitosos. Te muestro casos de éxito:"
`.trim();

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      model: "llama3-70b-8192",
      temperature: 0.6,
      max_tokens: 150,
      top_p: 0.9,
      frequency_penalty: 0.2,
      stop: ["\n", "---"],
    });

    const rawResponse = chatCompletion.choices[0]?.message?.content || "";

    const respuesta = rawResponse
      .replace(/[#*_\[\](){}<>`~]/g, "")
      .replace(/\b\d+\b/g, (match) => {
        const num = parseInt(match);
        return num.toLocaleString("es-ES");
      })
      .replace(/\n/g, " ")
      .replace(/([.!?])(\w)/g, "$1 $2")
      .substring(0, 250)
      .trim();

    return new NextResponse(JSON.stringify({ respuesta }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new NextResponse(
      JSON.stringify({
        error: "¡Estamos mejorando nuestro servicio! Contáctanos directamente:",
        contactos: {
          whatsapp_col: "https://wa.me/573125668800",
          whatsapp_mex: "https://wa.me/5218991499735",
          email: "capitalcodecol@gmail.com",
        },
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}
