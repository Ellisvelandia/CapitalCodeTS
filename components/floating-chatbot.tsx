"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaTimes,
  FaComment,
  FaVolumeUp,
  FaVolumeMute,
  FaPaperPlane,
} from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient"; // Ensure this is correctly imported

interface ChatMessage {
  type: "user" | "bot";
  content: string;
}

interface CustomerInfo {
  id: string;
  name: string;
  email: string;
}

export default function FloatingChatbot() {
  // Chat state
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    id: "",
    name: "",
    email: "",
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [spanishVoice, setSpanishVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Define preferred voice settings as state (you can later allow users to modify these)
  const [voiceSettings] = useState({
    rate: 1.0, // Normal speed for a more natural tone
    pitch: 1.0, // Normal pitch for a human-like sound
    volume: 1.0,
    preferredLanguage: "es-ES",
    fallbackLanguage: "es-US", // Fallback if preferred voice not found
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set up a Spanish voice with a list of preferred voices.
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const handleVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.lang === 'es-ES' && voice.name.includes('Google')) || voices[0];
      setSpanishVoice(selectedVoice);
    };

    window.speechSynthesis.onvoiceschanged = handleVoices;
    handleVoices(); // Initial check

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Scroll chat to the bottom when messages change.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper: speak a message using speech synthesis with improved settings.
  const speakMessage = (text: string) => {
    if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;

    const cleanText = text.replace(/¡/g, "").replace(/¿/g, "").replace(/\s+/g, " ").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Enhanced email validation.
  const isValidEmail = (email: string) => {
    const pattern =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!pattern.test(email)) {
      setFormError("Por favor ingrese un correo electrónico válido");
      return false;
    }
    return true;
  };

  /**
   * Create or upsert a customer record in Supabase.
   * Uses the upsert method with onConflict set to "email" so that if a record
   * with the same email exists, it returns that record rather than creating a duplicate.
   */
  const createCustomer = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .upsert({ name: customerInfo.name, email: customerInfo.email }, { onConflict: "email" })
        .select();

      if (error || !data || data.length === 0) {
        setFormError("Error creando el cliente: " + (error?.message || "unknown error"));
        return false;
      }
      // Update customerInfo with the new or existing id.
      setCustomerInfo((prev) => ({ ...prev, id: data[0].id }));
      return true;
    } catch (err) {
      setFormError("Error creando el cliente");
      return false;
    }
  };

  // Handle customer form submission.
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.email) {
      setFormError("Por favor complete todos los campos");
      return;
    }
    if (!isValidEmail(customerInfo.email)) return;

    // Create or upsert the customer record if no customer id exists.
    if (!customerInfo.id) {
      const created = await createCustomer();
      if (!created) return;
    }
    // Hide the form after successful customer creation/upsert.
    setShowCustomerForm(false);
    setFormError("");
  };

  // Handle chat toggle
  const handleChatToggle = () => {
    setIsOpen(prev => {
      if (!prev) {
        setShowCustomerForm(true); // Show the customer form when opening the chat
      }
      return !prev;
    });
  };

  // Handle sending a chat message.
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { type: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map((msg) => ({
            role: msg.type === "bot" ? "assistant" : "user",
            content: msg.content,
          })),
          customerInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: data.respuesta,
        },
      ]);

      speakMessage(data.respuesta);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "⚠️ Error al procesar tu solicitud. Intenta de nuevo más tarde.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <button
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        onClick={handleChatToggle}
        className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
      >
        {isOpen ? <FaTimes size={28} /> : <FaComment size={28} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="chatbot-heading"
          className="fixed bottom-20 right-0 w-full sm:w-96 h-[70vh] bg-white rounded-t-xl shadow-xl flex flex-col"
        >
          {/* Chat Header */}
          <div className="p-4 bg-blue-600 text-white flex justify-between items-center rounded-t-xl">
            <h2 id="chatbot-heading" className="font-bold text-lg">
              Asistente Virtual
            </h2>
            <div className="flex gap-2">
              <button
                aria-label={isMuted ? "Activar sonido" : "Silenciar"}
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 hover:bg-white/10 rounded-full"
              >
                {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
              </button>
            </div>
          </div>

          {/* Either show customer form or the chat conversation */}
          {showCustomerForm ? (
            <div className="flex-1 p-4 space-y-4">
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded-lg"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 border rounded-lg"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                {formError && (
                  <p className="text-red-500 text-sm">{formError}</p>
                )}

                <button
                  type="submit"
                  className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Comenzar conversación
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                aria-live="polite"
                aria-atomic="true"
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`p-3 rounded-xl max-w-[80%] ${
                        msg.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white shadow-md"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-xl shadow-md text-sm text-gray-600">
                      <span>Procesando...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 p-2 border rounded-lg text-sm"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`p-2 bg-blue-600 text-white rounded-lg transition-colors ${
                      isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
                    }`}
                  >
                    <FaPaperPlane size={20} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
