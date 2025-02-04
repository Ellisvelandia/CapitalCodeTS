// app/api/chat/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// Define types for WhatsApp numbers
interface WhatsAppNumber {
  country: string;
  number: string;
  flag: string;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    // Parse the incoming request body
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Entrada inválida" }, { status: 400 });
    }

    console.log("Mensaje del usuario:", message);

    // Step 1: Retrieve relevant data from Supabase based on the user's query
    const { data: servicesData } = await supabase
      .from("services")
      .select("*")
      .textSearch("title", message); // Buscar servicios relevantes

    const { data: guaranteesData } = await supabase
      .from("guarantees")
      .select("*")
      .textSearch("title", message); // Buscar garantías relevantes

    const { data: contactData } = await supabase
      .from("contact_info")
      .select("*"); // Obtener información de contacto

    console.log("Datos de Supabase:", {
      servicesData,
      guaranteesData,
      contactData,
    });

    // Step 2: Prepare the context by joining relevant data
    const servicesContext =
      servicesData?.map((s) => `- ${s.title}: ${s.description}`).join("\n") ||
      "No se encontraron servicios.";
    const guaranteesContext =
      guaranteesData?.map((g) => `- ${g.title}: ${g.description}`).join("\n") ||
      "No se encontraron garantías.";

    // Explicitly type the whatsapp_numbers array
    const whatsappNumbers = contactData?.[0]?.whatsapp_numbers as
      | WhatsAppNumber[]
      | undefined;

    const contactContext = `Contáctenos por correo electrónico: ${
      contactData?.[0]?.email
    } o WhatsApp: ${
      whatsappNumbers
        ?.map((w: WhatsAppNumber) => `${w.country} (${w.flag}): ${w.number}`)
        .join(", ") || "No hay números de WhatsApp disponibles"
    }`;

    // Create a conversational and dynamic context in Spanish
    const context = `
      ¡Hola! Estoy aquí para ayudarte con información sobre nuestros servicios y ofertas. Aquí está lo que encontré relacionado con tu consulta:

      Servicios:
      ${servicesContext}

      Garantías:
      ${guaranteesContext}

      Información de Contacto:
      ${contactContext}

      ¡Házmelo saber si tienes más preguntas!
    `;

    console.log("Contexto enviado a Groq:", context);

    // Step 3: Use the Groq API with the llama-3.3-70b-versatile model to generate a response
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres un asistente amigable y conocedor. Usa el siguiente contexto para responder la pregunta del usuario en un tono conversacional. Si no estás seguro, di "No estoy seguro, pero puedo intentar ayudarte".\n\nContexto:\n${context}`,
        },
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
    });

    console.log(
      "Respuesta de Groq:",
      chatCompletion.choices[0].message.content
    );

    // Step 4: Return the response from the model
    return NextResponse.json({
      response: chatCompletion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "No se pudo generar una respuesta." },
      { status: 500 }
    );
  }
}
