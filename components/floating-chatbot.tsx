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
  metadata?: {
    detectedIntent?: string;
    responseTime?: number;
  };
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
  const [spanishVoice, setSpanishVoice] = useState<SpeechSynthesisVoice | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Browser feature detection for speechSynthesis
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      const foundVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("es") ||
          voice.name.toLowerCase().includes("spanish")
      );
      setSpanishVoice(foundVoice || null);
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged
    );
    handleVoicesChanged(); // initial check

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged
      );
    };
  }, []);

  // Scroll chat to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper: speak a message using speech synthesis (if not muted)
  const speakMessage = (text: string) => {
    if (isMuted || typeof window === "undefined" || !window.speechSynthesis)
      return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (spanishVoice) {
      utterance.lang = spanishVoice.lang;
      utterance.voice = spanishVoice;
    } else {
      utterance.lang = "es-ES";
    }
    window.speechSynthesis.speak(utterance);
  };

  // Enhanced email validation
  const isValidEmail = (email: string) => {
    const pattern =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!pattern.test(email)) {
      setFormError("Por favor ingrese un correo electrónico válido");
      return false;
    }
    return true;
  };

  // Function to create a customer record in Supabase if none exists
  const createCustomer = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({ name: customerInfo.name, email: customerInfo.email })
        .select();
      if (error || !data || data.length === 0) {
        setFormError(
          "Error creando el cliente: " + (error?.message || "unknown error")
        );
        return false;
      }
      // Update customerInfo with the new id
      setCustomerInfo((prev) => ({ ...prev, id: data[0].id }));
      return true;
    } catch (err) {
      setFormError("Error creando el cliente");
      return false;
    }
  };

  // Handle customer form submission (to update or create customer info)
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.email) {
      setFormError("Por favor complete todos los campos");
      return;
    }
    if (!isValidEmail(customerInfo.email)) return;

    // Create a new customer record if no customer id exists
    if (!customerInfo.id) {
      const created = await createCustomer();
      if (!created) return;
    }
    // Hide the form after successful customer creation
    setShowCustomerForm(false);
    setFormError("");
  };

  // Handle sending a chat message
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    // If there is no customer id, prompt the user to fill out the customer form.
    if (!customerInfo.id) {
      setShowCustomerForm(true);
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { type: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map((msg) => ({
        role: msg.type === "bot" ? "assistant" : "user",
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: history,
          customerInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          data.error === "invalid_customer" ||
          data.error === "customer_not_found"
        ) {
          setShowCustomerForm(true);
          setFormError("Necesitamos actualizar tus datos");
          throw new Error("Invalid customer session");
        }
        throw new Error(data.error || `Error: ${response.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: data.respuesta,
          metadata: {
            detectedIntent: data.metadata?.detectedIntent,
            responseTime: data.metadata?.responseTime,
          },
        },
      ]);

      speakMessage(data.respuesta);
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: error.message.includes("temporal")
            ? "⚠️ Error temporal. Contacta: capitalcodecol@gmail.com"
            : "⚠️ Necesitamos verificar tus datos. Completa el formulario nuevamente.",
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
        onClick={() => setIsOpen(!isOpen)}
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
                {isMuted ? (
                  <FaVolumeMute size={20} />
                ) : (
                  <FaVolumeUp size={20} />
                )}
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
                    className={`flex ${
                      msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl max-w-[80%] ${
                        msg.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white shadow-md"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {msg.metadata?.detectedIntent && (
                        <p className="text-xs mt-1 opacity-70">
                          Intención detectada: {msg.metadata.detectedIntent}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-xl shadow-md text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 100}ms` }}
                            />
                          ))}
                        </div>
                        <span>Procesando...</span>
                      </div>
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
                    placeholder="Escribe o dicta tu mensaje..."
                    className="flex-1 p-2 border rounded-lg text-sm"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`p-2 bg-blue-600 text-white rounded-lg transition-colors ${
                      isLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-700"
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
