"use client";
import { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaComment,
  FaVolumeUp,
  FaVolumeMute,
  FaPaperPlane,
} from "react-icons/fa";
import { speakMessage, stopSpeaking } from "@/lib/speech/speech-synthesis";

// Define the chat message structure.
interface ChatMessage {
  type: "user" | "bot";
  content: string;
}

export default function Chat() {
  // UI State
  const [isOpen, setIsOpen] = useState(false); // Toggle chat window
  const [isMuted, setIsMuted] = useState(false); // Mute/unmute voice
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick questions for easy access (clear CTAs)
  const quickQuestions = [
    "¿Qué servicios ofrecen?",
    "¿Cuáles son los precios?",
    "¿Cuáles son los pasos del proceso?",
    "¿Qué garantías tienen?",
    "¿Cómo contactar con soporte?",
  ];

  // Auto-scroll to the bottom whenever messages update (improves engagement)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Stop any ongoing speech before sending new message
    stopSpeaking();

    const userMsg = inputMessage.trim();
    setInputMessage("");
    const newUserMessage: ChatMessage = { type: "user", content: userMsg };
    setMessages((prev) => [...prev, newUserMessage]);
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Server error details:", data.details);
        throw new Error(data.error || "Error del servidor");
      }

      const botMessageContent = data.response;
      if (!botMessageContent) {
        throw new Error("No se recibió respuesta del servidor");
      }

      // Log which model was used (if provided)
      if (data.model) {
        console.log(`Response generated using model: ${data.model}`);
      }

      const botMsg: ChatMessage = { type: "bot", content: botMessageContent };
      setMessages((prev) => [...prev, botMsg]);

      // Add a small delay before starting speech
      if (!isMuted) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 100));
          await speakMessage(botMessageContent, isMuted);
        } catch (error) {
          console.error("Error speaking message:", error);
          // Don't throw here - we still want to show the message even if speech fails
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = error.message || "Ocurrió un error inesperado";
      const botMsg: ChatMessage = { 
        type: "bot", 
        content: `Lo siento, ${errorMsg.toLowerCase()}. Por favor, intenta nuevamente en unos momentos.` 
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle the chat window open/closed.
  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      className={`fixed bottom-8 right-8 z-50 ${
        isOpen ? "animate-fade-in" : ""
      }`}
    >
      {/* Chat Toggle Button - Clear CTA with modern gradient */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all focus:outline-none"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        {isOpen ? <FaTimes size={28} /> : <FaComment size={28} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="chatbot-heading"
          className="fixed bottom-24 right-4 w-full max-w-xs sm:max-w-md h-[70vh] bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col transition-transform transform-gpu"
        >
          {/* Chat Header - Modern look, clear typography */}
          <div className="p-4 bg-black text-white flex justify-between items-center rounded-t-xl shadow-md">
            <h2 id="chatbot-heading" className="font-bold text-2xl">
              Capital Code
            </h2>
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (!isMuted) {
                  stopSpeaking(); // Stop speech when muting
                }
              }}
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
              className="p-1.5 hover:bg-gray-800 rounded-full focus:outline-none"
            >
              {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
            </button>
          </div>

          {/* Chat Messages - Clean, uncluttered design */}
          <div
            className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-4 rounded-b-xl"
            aria-live="assertive"
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
                  className={`p-3 rounded-xl max-w-[80%] transition-all duration-300 ${
                    msg.type === "user"
                      ? "bg-black text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-xl shadow-md">
                  <span className="animate-pulse text-gray-700 dark:text-gray-300 text-sm">
                    El asistente está escribiendo...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInputMessage(q);
                    handleSend({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  className="text-xs bg-black/5 hover:bg-black/10 text-black dark:text-white px-3 py-1.5 rounded-full transition-colors"
                  aria-label={`Pregunta rápida: ${q}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSend}
            className="p-4 border-t bg-gray-100 dark:bg-gray-800 rounded-b-xl"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                disabled={isLoading}
                aria-label="Entrada de mensaje"
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`p-2 bg-black text-white rounded-lg transition-colors ${
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-900"
                }`}
                aria-label="Enviar mensaje"
              >
                <FaPaperPlane size={20} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
