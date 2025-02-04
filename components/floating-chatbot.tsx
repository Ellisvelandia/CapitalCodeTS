"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaComment,
  FaVolumeUp,
  FaVolumeMute,
  FaPaperPlane,
} from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";

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
  // Chat and customer state variables.
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set up Spanish voice for speech synthesis.
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(
        (voice) => voice.lang === "es-ES" && voice.name.includes("Google")
      ) || voices[0];
      setSpanishVoice(selectedVoice);
    }
  }, []);

  // Auto-scroll the chat window when new messages arrive.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Use speech synthesis to read out bot messages.
  const speakMessage = (text: string) => {
    if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (spanishVoice) utterance.voice = spanishVoice;
    window.speechSynthesis.speak(utterance);
  };

  // Enhanced email validation.
  const isValidEmail = (email: string) => {
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(email)) {
      setFormError("Por favor ingrese un correo electrónico válido");
      return false;
    }
    return true;
  };

  // Create or update a customer record in Supabase.
  const createOrUpsertCustomer = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .upsert({ name: customerInfo.name, email: customerInfo.email }, { onConflict: "email" })
        .select();

      if (error || !data || data.length === 0) {
        setFormError("Error creando el cliente.");
        return false;
      }
      setCustomerInfo((prev) => ({ ...prev, id: data[0].id }));
      return true;
    } catch (err) {
      setFormError("Error creando el cliente.");
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

    if (!customerInfo.id) {
      const created = await createOrUpsertCustomer();
      if (!created) return;
    }
    setShowCustomerForm(false);
    setFormError("");
  };

  // Toggle chat visibility.
  const handleChatToggle = () => {
    setIsOpen((prev) => {
      if (!prev) {
        setShowCustomerForm(true);
      }
      return !prev;
    });
  };

  // Handle sending a chat message.
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { type: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          conversationHistory: messages.map((msg) => ({
            role: msg.type === "bot" ? "assistant" : "user",
            content: msg.content,
          })),
          customerInfo,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error");

      const botMessage = data.respuesta;
      setMessages((prev) => [...prev, { type: "bot", content: botMessage }]);
      speakMessage(botMessage);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "⚠️ Error al procesar tu solicitud. Intenta de nuevo más tarde." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Chat Toggle Button */}
      <button
        onClick={handleChatToggle}
        className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        {isOpen ? <FaTimes size={28} /> : <FaComment size={28} />}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="chatbot-heading"
          className="fixed bottom-24 right-8 w-full sm:w-96 h-[70vh] bg-white rounded-t-xl shadow-xl flex flex-col"
        >
          {/* Chat Header */}
          <div className="p-4 bg-blue-600 text-white flex justify-between items-center rounded-t-xl">
            <h2 id="chatbot-heading" className="font-bold text-lg">
              Asistente Virtual
            </h2>
            <button
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
              className="p-1.5 hover:bg-white/10 rounded-full"
            >
              {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
            </button>
          </div>

          {/* Customer Form or Chat Conversation */}
          {showCustomerForm ? (
            <div className="flex-1 p-4 space-y-4">
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre completo</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded-lg"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 border rounded-lg"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                {formError && <p className="text-red-500 text-sm">{formError}</p>}
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
                        msg.type === "user" ? "bg-blue-600 text-white" : "bg-white shadow-md"
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
