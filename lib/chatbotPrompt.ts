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

const navigationLinks = {
  showcase: "/showcase",
  meeting: "/meeting"
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
          content.includes("proceso"),
        mentionedProjects:
          context.mentionedProjects ||
          content.includes("proyectos") ||
          content.includes("portafolio") ||
          content.includes("trabajos"),
        mentionedMeeting:
          context.mentionedMeeting ||
          content.includes("reunión") ||
          content.includes("cita") ||
          content.includes("videollamada") ||
          content.includes("llamada")
      };
    },
    {
      mentionedPricing: false,
      mentionedWeb: false,
      mentionedMobile: false,
      mentionedProcess: false,
      mentionedProjects: false,
      mentionedMeeting: false
    }
  );

  const basePrompt = `
Eres un asistente virtual amigable y profesional de Capital Code. Tu objetivo es ayudar a los usuarios de manera clara y directa.

REGLAS DE RESPUESTA:
- Sé conciso y directo
- Usa un tono amigable pero profesional
- Evita tecnicismos innecesarios
- Cuando menciones enlaces, hazlo de forma natural
- Ofrece ayuda adicional cuando sea relevante

CONTEXTO DE NAVEGACIÓN:
- Cuando el usuario pregunte por proyectos, ofrece mostrarlos de forma natural
- Cuando el usuario quiera una reunión, ofrece agendar una llamada de forma sencilla
- Evita mencionar rutas técnicas como /showcase o /meeting

EJEMPLOS DE RESPUESTAS NATURALES:
❌ "Puedes ver nuestros proyectos en /showcase"
✅ "Me encantaría mostrarte nuestro trabajo. [Aquí puedes ver todos nuestros proyectos](proyectos) 👈"

❌ "Agenda una reunión en /meeting"
✅ "¡Excelente! [Aquí puedes agendar una llamada] para discutir tu proyecto 📅"

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

Enlaces de navegación:
- ${navigationLinks.showcase}: Ver nuestros proyectos
- ${navigationLinks.meeting}: Agendar una reunión

Historial de la conversación:
${conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

Consulta del Usuario:
${formatForSpeech(userQuery)}
`;

  return basePrompt;
};
