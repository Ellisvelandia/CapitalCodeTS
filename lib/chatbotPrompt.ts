import { services, processSteps, guarantees, contactInfo } from './data';

export const buildChatbotPrompt = (userQuery: string): string => {
  return `
Actúa como un asistente de servicio al cliente para Capital Code. Utiliza la siguiente información para responder preguntas sobre nuestros servicios, procesos, garantías y métodos de contacto.

Servicios:
${services.map((service) => `- ${service.title}: "${service.description}"`).join("\n")}

Pasos del Proceso:
${processSteps.map((step) => `- ${step.step}: "${step.description}"`).join("\n")}

Garantías:
${guarantees.map((g) => `- ${g.title}: "${g.description}"`).join("\n")}

Información de Contacto:
- Whatsapp:
    ${contactInfo.whatsappNumbers.map((num) => `${num.flag} ${num.country}: ${num.number}`).join("\n    ")}
- Email: ${contactInfo.email}

Pregunta del usuario: ${userQuery}

Por favor, responde de forma clara, útil y en español.
  `;
}; 