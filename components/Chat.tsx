"use client";
import { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaComment,
  FaVolumeUp,
  FaVolumeMute,
  FaPaperPlane,
} from "react-icons/fa";

// Define the chat message structure.
interface ChatMessage {
  type: "user" | "bot";
  content: string;
}

export default function Chat() {
  // State for toggling the chat window.
  const [isOpen, setIsOpen] = useState(false);
  // State for muting/unmuting voice output.
  const [isMuted, setIsMuted] = useState(false);
  // State for managing the input message.
  const [inputMessage, setInputMessage] = useState("");
  // State for storing chat messages.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Loading state while waiting for the bot response.
  const [isLoading, setIsLoading] = useState(false);
  // Reference to the end of the messages list for auto-scrolling.
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // State to store a selected Spanish voice.
  const [spanishVoice, setSpanishVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Set up the Spanish voice for speech synthesis when the component mounts.
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        // Choose a Spanish voice if available.
        const voice = voices.find(
          (v) => v.lang === "es-ES" && v.name.includes("Google")
        ) || voices[0];
        setSpanishVoice(voice);
      } else {
        // Some browsers load voices asynchronously.
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          const voice = voices.find(
            (v) => v.lang === "es-ES" && v.name.includes("Google")
          ) || voices[0];
          setSpanishVoice(voice);
        };
      }
    }
  }, []);

  // Auto-scroll to the bottom when new messages arrive.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speak the bot's message aloud if not muted.
  const speakMessage = (text: string) => {
    if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (spanishVoice) utterance.voice = spanishVoice;
    window.speechSynthesis.speak(utterance);
  };

  // Handle sending a message.
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg = inputMessage.trim();
    setInputMessage("");
    // Append the user's message.
    const newUserMessage: ChatMessage = { type: "user", content: userMsg };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Send the message to the backend API.
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

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();
      const botMessageContent = data.response || "Lo siento, no se obtuvo respuesta.";
      const botMsg: ChatMessage = { type: "bot", content: botMessageContent };
      setMessages((prev) => [...prev, botMsg]);
      speakMessage(botMessageContent);
    } catch (error) {
      console.error("Chat error", error);
      const errorMsg: ChatMessage = {
        type: "bot",
        content: "⚠️ Error al procesar tu solicitud. Intenta de nuevo más tarde.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle the chat window open/closed.
  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all focus:outline-none"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        {isOpen ? <FaTimes size={28} /> : <FaComment size={28} />}
      </button>

      {/* Chat Window */}
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
              className="p-1.5 hover:bg-white/10 rounded-full focus:outline-none"
            >
              {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
            </button>
          </div>

          {/* Chat Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"
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
                className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>
      )}
    </div>
  );
}
