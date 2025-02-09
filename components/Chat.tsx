"use client";
import { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaComment,
  FaVolumeUp,
  FaVolumeMute,
  FaPaperPlane,
  FaExpandAlt,
  FaCompressAlt,
} from "react-icons/fa";
import { speakMessage, stopSpeaking } from "@/lib/speech/speech-synthesis";

// Define the chat message structure.
interface ChatMessage {
  type: "user" | "bot";
  content: string;
}

export default function Chat() {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick questions for easy access
  const quickQuestions = [
    "¿Qué servicios ofrecen?",
    "¿Cuáles son los precios?",
    "¿Cuáles son los pasos del proceso?",
    "¿Qué garantías tienen?",
    "¿Cómo contactar con soporte?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

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

      if (data.model) {
        console.log(`Response generated using model: ${data.model}`);
      }

      const botMsg: ChatMessage = { type: "bot", content: botMessageContent };
      setMessages((prev) => [...prev, botMsg]);

      if (!isMuted) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 100));
          await speakMessage(botMessageContent, isMuted);
        } catch (error) {
          console.error("Error speaking message:", error);
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

  const toggleChat = () => {
    if (isExpanded) {
      setIsExpanded(false);
      setTimeout(() => {
        setIsOpen(false);
      }, 300); // Wait for collapse animation
    } else {
      setIsOpen(prev => !prev);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div
      className={`fixed ${isExpanded ? 'inset-0 z-50' : 'bottom-8 right-8 z-50'} ${
        isOpen ? "animate-fade-in" : ""
      } transition-all duration-300`}
    >
      {!isExpanded && (
        <button
          onClick={toggleChat}
          className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all focus:outline-none"
          aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        >
          {isOpen ? <FaTimes size={28} /> : <FaComment size={28} />}
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="chatbot-heading"
          className={`${
            isExpanded 
              ? 'fixed inset-0 w-full h-full'
              : 'fixed bottom-24 right-4 w-full max-w-xs sm:max-w-md h-[70vh]'
          } bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col transition-all duration-300`}
        >
          <div className="p-4 bg-black text-white flex items-center justify-between rounded-t-xl shadow-md">
            <div className="flex items-center gap-2">
              {isExpanded && (
                <button
                  onClick={toggleChat}
                  className="p-1.5 hover:bg-gray-800 rounded-full focus:outline-none"
                  aria-label="Cerrar chat"
                >
                  <FaTimes size={20} />
                </button>
              )}
              <button
                onClick={toggleExpand}
                aria-label={isExpanded ? "Minimizar chat" : "Expandir chat"}
                className="p-1.5 hover:bg-gray-800 rounded-full focus:outline-none"
              >
                {isExpanded ? <FaCompressAlt size={20} /> : <FaExpandAlt size={20} />}
              </button>
            </div>
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (!isMuted) {
                  stopSpeaking();
                }
              }}
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
              className="p-1.5 hover:bg-gray-800 rounded-full focus:outline-none"
            >
              {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl ${
                    message.type === "user"
                      ? "bg-black text-white rounded-br-none"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl rounded-bl-none">
                  <p>Escribiendo...</p>
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

          <div className="p-4 border-t dark:border-gray-700">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 p-2 border dark:border-gray-700 rounded-lg focus:outline-none focus:border-black dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
