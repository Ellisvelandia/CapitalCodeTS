  "use client";
  import { useState, useEffect, useRef } from "react";
  import {
    FaTimes,
    FaComment,
    FaVolumeUp,
    FaVolumeMute,
    FaPaperPlane,
  } from "react-icons/fa";
  import { speakMessage } from '@/lib/speech/speech-synthesis';

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

    // Define quick questions based on services
    const quickQuestions = [
      "¿Qué servicios ofrecen?",
      "¿Cuáles son los pasos del proceso?",
      "¿Qué garantías tienen?",
      "¿Cómo contactar con soporte?",
    ];

    // Set up the Spanish voice for speech synthesis when the component mounts.
    useEffect(() => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          const voice = voices.find(
            (v) => v.lang === "es-ES" && v.name.includes("Google")
          ) || voices[0];
          setSpanishVoice(voice);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }, []);

    // Auto-scroll to the bottom when new messages arrive.
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle sending a message.
    const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputMessage.trim() || isLoading) return;

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
          throw new Error(data.error || "Error del servidor");
        }

        const botMessageContent = data.response;
        if (!botMessageContent) {
          throw new Error("No se recibió respuesta del servidor");
        }

        const botMsg: ChatMessage = { type: "bot", content: botMessageContent };
        setMessages((prev) => [...prev, botMsg]);
        
        if (!isMuted) {
          try {
            const cleanup = speakMessage(botMessageContent, isMuted);
          } catch (error) {
            console.error('Failed to initialize speech:', error);
          }
        }
      } catch (error: any) {
        console.error("Chat error:", error);
        const errorMsg: ChatMessage = {
          type: "bot",
          content: `⚠️ ${error.message || "Error al procesar tu solicitud. Por favor, intenta de nuevo más tarde."}`,
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

    // Use speakMessage in your component
    const handleBotResponse = (response: string) => {
      setMessages(prev => [...prev, { type: "bot", content: response }]);
      speakMessage(response);
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
            className="fixed bottom-24 right-4 w-full max-w-xs sm:max-w-md h-[70vh] bg-white rounded-xl shadow-lg flex flex-col transition-transform transform-gpu"
          >
            {/* Chat Header */}
            <div className="p-4 bg-blue-600 text-white flex justify-between items-center rounded-t-xl shadow-md">
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
              className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 rounded-b-xl"
              aria-live="polite"
              aria-atomic="true"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[80%] transition-all duration-300 ${
                      msg.type === "user"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white shadow-lg"
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

            {/* Quick Questions */}
            <div className="p-4 bg-gray-100 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputMessage(q);
                      handleSend({ preventDefault: () => {} } as React.FormEvent); // Trigger send
                    }}
                    className="text-xs bg-blue-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-blue-200 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} className="p-4 border-t bg-gray-100 rounded-b-xl">
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
