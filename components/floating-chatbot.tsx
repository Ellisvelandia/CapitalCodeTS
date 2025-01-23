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
    SpeechRecognition: any;
  }
}

interface Message {
  type: "user" | "bot";
  content: string;
  image?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
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
    const initializeSpeech = () => {
      if (typeof window !== "undefined") {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognition.current = new SpeechRecognition();
          recognition.current.lang = "es-ES";
          recognition.current.interimResults = false;
          recognition.current.continuous = false;

          recognition.current.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            setInputMessage(transcript.trim());
          };

          recognition.current.onerror = (event: Event) => {
            console.error("Speech recognition error:", event);
          };

          recognition.current.onstart = () => setIsListening(true);
          recognition.current.onend = () => setIsListening(false);
        }

        synthesis.current = window.speechSynthesis;
        synthesis.current.onvoiceschanged = () => {
          console.log("Available voices:", synthesis.current?.getVoices());
        };
      }
    };

    initializeSpeech();
    return () => {
      recognition.current?.stop();
      synthesis.current?.cancel();
    };
  }, []);

  const getVoice = () => {
    if (!synthesis.current) return null;
    const voices = synthesis.current.getVoices();
    const preferredVoices = [
      "Microsoft Helena",
      "Google español",
      "Paulina",
      "Jorge",
      "Español latinoamericano",
    ];

    return (
      voices.find(
        (v) =>
          preferredVoices.some((name) => v.name.includes(name)) &&
          v.lang.startsWith("es")
      ) || voices[0]
    );
  };

  const speakMessage = (text: string) => {
    if (!synthesis.current || isMuted) return;

    synthesis.current.cancel();
    const processedText = text
      .replace(/\[PAUSE\]/g, "") // Remove any existing pause markers
      .replace(/([.!?])/g, "$1 ");

    const utterance = new SpeechSynthesisUtterance(processedText);
    const voice = getVoice();

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.rate = 0.9;
    utterance.pitch = 0.95;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utterance.onboundary = (event) => {
      if (event.name === "sentence") {
        synthesis.current?.pause();
        synthesis.current?.resume();
      }
    };

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
        body: JSON.stringify({ message: userMessage }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Error en la respuesta");

      const { response: botMessage } = await response.json();

      setMessages((prev) => [...prev, { type: "bot", content: botMessage }]);
      !isMuted && speakMessage(botMessage);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content:
            "Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setMessages((prev) => [
        ...prev,
        {
          type: "user",
          content: "",
          image: e.target?.result as string,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-all duration-300"
        aria-label="Abrir chat"
      >
        {isOpen ? (
          <IconX size={30} className="hover:rotate-90 transition-transform" />
        ) : (
          <IconMessage2
            size={30}
            className="hover:scale-110 transition-transform"
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 h-[600px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Asistente Virtual</h3>
                <p className="text-sm opacity-90 font-medium">Capital Code</p>
              </div>
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label={isMuted ? "Activar sonido" : "Silenciar"}
              >
                {isMuted ? (
                  <IconVolumeOff size={24} className="text-white/80" />
                ) : (
                  <IconVolume size={24} className="text-white/80" />
                )}
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl ${
                    message.type === "user"
                      ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                      : "bg-white text-gray-800 shadow-sm border border-gray-200"
                  }`}
                >
                  {message.image ? (
                    <img
                      src={message.image}
                      alt="Contenido subido"
                      className="max-w-full h-40 object-cover rounded-lg mb-2"
                    />
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  <div className="mt-1 text-xs opacity-70">
                    {message.type === "user" ? "Tú" : "Asistente"}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-sm">
                      {isSpeaking ? "Generando respuesta..." : "Procesando..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Container */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="flex-1 flex gap-2 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-sm"
                  disabled={isListening}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleImageUpload(e.target.files[0])
                  }
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="p-2 bg-white hover:bg-gray-50 text-gray-600 rounded-lg cursor-pointer border border-gray-200 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M4 5h13v7h2V5c0-1.103-.897-2-2-2H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h8v-2H4V5z" />
                    <path d="m8 11-3 4h11l-4-6-3 4z" />
                    <path d="M19 14h-2v3h-3v2h3v3h2v-3h3v-2h-3z" />
                  </svg>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => recognition.current?.start()}
                  className={`p-3 rounded-xl transition-colors ${
                    isListening
                      ? "bg-red-500 text-white shadow-lg"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  }`}
                  disabled={!recognition.current}
                >
                  <IconMicrophone size={20} />
                </button>
                <button
                  type="submit"
                  className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  disabled={isLoading}
                >
                  <IconSend size={20} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingChatbot;
