"use client";
import { useState, useRef, useEffect } from "react";
import {
  IconMessage2,
  IconX,
  IconSend,
  IconMicrophone,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons-react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface Message {
  type: "user" | "bot";
  content: string;
}

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content:
        "¡Hola! Soy el asistente de Capital Code. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Inicializar reconocimiento de voz
      if ("webkitSpeechRecognition" in window) {
        recognition.current = new window.webkitSpeechRecognition();
        recognition.current.continuous = false;
        recognition.current.interimResults = false;
        recognition.current.lang = "es-ES";

        recognition.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript.trim());
        };

        recognition.current.onerror = (event: any) => {
          console.error("Error de reconocimiento:", event.error);
        };

        recognition.current.onstart = () => setIsListening(true);
        recognition.current.onend = () => setIsListening(false);
      }

      // Inicializar síntesis de voz
      synthesis.current = window.speechSynthesis;
    }

    return () => {
      recognition.current?.stop();
      synthesis.current?.cancel();
    };
  }, []);

  const speakMessage = (text: string) => {
    if (!synthesis.current || isMuted) return;

    synthesis.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Seleccionar voz en español
    const voices = synthesis.current.getVoices();
    const spanishVoice = voices.find((v) => v.lang.startsWith("es"));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
      utterance.lang = spanishVoice.lang;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    currentUtterance.current = utterance;
    synthesis.current.speak(utterance);
  };

  const toggleMute = () => {
    synthesis.current?.cancel();
    setIsMuted(!isMuted);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { type: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.respuesta) {
        throw new Error("Respuesta vacía del servidor");
      }

      setMessages((prev) => [
        ...prev,
        { type: "bot", content: data.respuesta },
      ]);
      !isMuted && speakMessage(data.respuesta);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content:
            "Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo más tarde.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
      >
        {isOpen ? (
          <IconX size={28} className="animate-spin-once" />
        ) : (
          <IconMessage2 size={28} />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 sm:hidden z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed bottom-0 right-0 sm:absolute sm:bottom-20 w-full sm:w-96 h-[85vh] sm:h-[600px] bg-white rounded-t-xl sm:rounded-xl shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">Asistente Virtual</h2>
                <p className="text-sm opacity-90">Capital Code</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleMute}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isMuted ? (
                    <IconVolumeOff size={20} />
                  ) : (
                    <IconVolume size={20} />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 sm:hidden hover:bg-white/10 rounded-full"
                >
                  <IconX size={20} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
                        ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                        : "bg-white text-gray-800 shadow-md"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.type === "user" ? "Tú" : "Asistente"}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-xl shadow-md text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                      </div>
                      <span>Procesando...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="w-full p-2.5 pr-12 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => recognition.current?.start()}
                    className={`absolute right-2 top-2 p-1.5 rounded-lg ${
                      isListening
                        ? "bg-red-500 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    disabled={!recognition.current}
                  >
                    <IconMicrophone size={18} />
                  </button>
                </div>
                <button
                  type="submit"
                  className="p-2.5 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-md disabled:opacity-50"
                  disabled={isLoading}
                >
                  <IconSend size={18} />
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingChatbot;
