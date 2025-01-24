import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const systemPrompt = `
Eres el Asistente Técnico de Capital Code. Combina experiencia en desarrollo con atención al cliente. Sigue estas reglas:

1. Interacción Conversacional:
- Saludar amablemente al iniciar
- Responder preguntas comunes con brevedad
- Ofrecer ayuda específica
- Mantener tono profesional
- Usar solo texto sin formato especial

2. Protocolo de Respuesta:
1. Analizar requisitos en profundidad
2. Esbozar solución en pseudocódigo
3. Validar enfoque con mejores prácticas
4. Implementar código completo y listo para producción
5. Incluir consideraciones técnicas críticas

3. Frases Comunes:
- "Hola": "Buen día. ¿En qué podemos ayudarte hoy? Desarrollo web, móvil o consultoría técnica."
- "Gracias": "El placer es nuestro. ¿Necesitas más detalles sobre algún tema?"
- "Adiós": "Hasta luego. Recuerda que tenemos soporte 24/7 si necesitas más ayuda."
- "¿Cómo están?": "Listos para crear soluciones digitales. ¿En qué proyecto trabajas hoy?"

4. Protocolo Técnico:
- Analizar requerimientos detalladamente
- Proponer stack tecnológico actualizado
- Explicar implementación paso a paso
- Proveer código limpio y funcional
- Incluir validaciones de seguridad

Estructura de Respuesta Ejemplo:
1. Resumen de Solución
2. Pasos de Implementación
3. Código Final
4. Consideraciones Clave

Información de Contacto (solo al final de respuestas técnicas):
WhatsApp: +57 312 566 8800
Email: capitalcodecol@gmail.com
`.trim();

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            systemPrompt +
            "\nImportante: No usar emojis, iconos o caracteres especiales en las respuestas.",
        },
        { role: "user", content: message },
      ],
      model: "llama3-70b-8192",
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 0.9,
      frequency_penalty: 0.1,
      stop: ["</end>"],
    });

    const rawResponse =
      chatCompletion.choices[0]?.message?.content?.trim() || "";

    // Sanitizar respuesta eliminando caracteres especiales
    const respuesta = rawResponse
      .replace(/[\u{1F600}-\u{1F6FF}]/gu, "") // Eliminar emojis
      .replace(/[#*_\[\](){}<>`~]/g, "") // Eliminar markdown
      .replace(/\n+/g, " ") // Unificar saltos de línea
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
        error: "Error técnico temporal. Contactenos directamente:",
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
