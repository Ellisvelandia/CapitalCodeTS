import { services, processSteps, guarantees, contactInfo } from "./data";

const formatForSpeech = (text: string): string => {
  return text
    .replace(/\$/g, " dólares ")
    .replace(/\+/g, " más ")
    .replace(/&/g, " y ")
    .replace(/\//g, " o ")
    .replace(/24\/7/g, "24 7")
    .replace(/\*/g, "")
    .replace(/\n\s*\n/g, "\n")
    .replace(/[""]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const buildChatbotPrompt = (
  userQuery: string,
  conversationHistory: any[] = []
): string => {
  const formattedServices = services.map((service) => ({
    ...service,
    description: formatForSpeech(service.description),
  }));

  const formattedGuarantees = guarantees.map((g) => ({
    ...g,
    description: formatForSpeech(g.description),
  }));

  // Extract user preferences and context from conversation history
  const userContext = conversationHistory.reduce(
    (context, msg) => {
      const content = msg.content.toLowerCase();
      return {
        ...context,
        mentionedPricing:
          context.mentionedPricing ||
          content.includes("precio") ||
          content.includes("costo"),
        mentionedWeb:
          context.mentionedWeb ||
          content.includes("web") ||
          content.includes("página"),
        mentionedMobile:
          context.mentionedMobile ||
          content.includes("móvil") ||
          content.includes("app"),
        mentionedProcess:
          context.mentionedProcess ||
          content.includes("proceso") ||
          content.includes("pasos"),
      };
    },
    {
      mentionedPricing: false,
      mentionedWeb: false,
      mentionedMobile: false,
      mentionedProcess: false,
    }
  );

  return `
Eres un experto profesional de servicio al cliente de Capital Code. Analiza cada consulta y proporciona respuestas naturales basadas en nuestra información.

DIRECTRICES:
- Da respuestas concisas y relevantes
- Evita mencionar que eres un bot o asistente
- No uses fórmulas de saludo genéricas
- Responde directamente a lo que se pregunta
- Mantén un tono profesional pero cercano
- Adapta las respuestas al contexto de la conversación
- Si el usuario dice "no" o muestra desinterés, no insistas
- Si el usuario dice algo como "en nada", responde brevemente y espera nueva interacción
- Prioriza información basada en el historial de la conversación

${
  userContext.mentionedPricing
    ? `
CONTEXTO DE PRECIOS:
- El usuario ha mostrado interés en precios
- Enfócate en el valor y beneficios
- Menciona las garantías relevantes
`
    : ""
}

${
  userContext.mentionedWeb || userContext.mentionedMobile
    ? `
CONTEXTO DE DESARROLLO:
- El usuario está interesado en ${
        userContext.mentionedWeb ? "desarrollo web" : ""
      }${userContext.mentionedWeb && userContext.mentionedMobile ? " y " : ""}${
        userContext.mentionedMobile ? "desarrollo móvil" : ""
      }
- Enfatiza experiencia en estos servicios
- Menciona casos de éxito relevantes
`
    : ""
}

Información de Capital Code:

Servicios:
${formattedServices
  .map((service) => `- ${service.title}: ${service.description}`)
  .join("\n")}

Proceso:
${processSteps.map((step) => `- ${step.step}: ${step.description}`).join("\n")}

Garantías:
${formattedGuarantees.map((g) => `- ${g.title}: ${g.description}`).join("\n")}

Contacto:
- WhatsApp:
    ${contactInfo.whatsappNumbers
      .map((num) => `${num.flag} ${num.country}: ${num.number}`)
      .join("\n    ")}
- Email: ${contactInfo.email}

EJEMPLOS DE RESPUESTAS:

❌ "Hola, soy el asistente virtual de Capital Code..."
✅ "El desarrollo web incluye hosting, dominio y 4 páginas por 300 dólares"

❌ "Te cuento que nuestros servicios son..."
✅ "Para tu proyecto necesitas: Sistema base (800 dólares), integración de pagos y panel administrativo"

❌ "Como asistente virtual, te explico..."
✅ "Claro, podemos empezar con una llamada para discutir los detalles de tu app"

Historial de la conversación:
${conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

Consulta del Usuario:
${formatForSpeech(userQuery)}
`;
};
