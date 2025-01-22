"use client";

import { useState, useRef, useEffect } from "react";
import {
  IconMessage2,
  IconX,
  IconSend,
  IconMicrophone,
} from "@tabler/icons-react";

interface Message {
  type: "user" | "bot";
  content: string;
  image?: string;
}

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content:
        "¡Hola! Soy el asistente virtual de Capital Code. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);

  // Speech synthesis
  const speakMessage = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition.current = new SpeechRecognition();
        recognition.current.lang = "es-ES";
        recognition.current.interimResults = false;

        recognition.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
        };

        recognition.current.onstart = () => setIsListening(true);
        recognition.current.onend = () => setIsListening(false);
      }
    }
  }, []);

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
      const formData = new FormData();
      formData.append("message", userMessage);

      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Error en la respuesta");

      const data = await response.json();
      const botMessage = data.response;

      setMessages((prev) => [...prev, { type: "bot", content: botMessage }]);
      speakMessage(botMessage);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content:
            "Lo siento, ha ocurrido un error. Por favor, intenta de nuevo más tarde.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add image handling
  const handleImageUpload = async (file: File) => {
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
        className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors"
        aria-label="Abrir chat"
      >
        {isOpen ? <IconX size={30} /> : <IconMessage2 size={30} />}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 h-[500px] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
          <div className="p-4 bg-blue-500 text-white">
            <h3 className="text-lg font-semibold">Asistente Virtual</h3>
            <p className="text-sm opacity-90">Capital Code</p>
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
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.image ? (
                    <img
                      src={message.image}
                      alt="Uploaded content"
                      className="max-w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  Escribiendo...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                >
                  📷
                </label>
              </div>
              <button
                type="button"
                onClick={() => recognition.current?.start()}
                className={`p-2 rounded-lg ${
                  isListening
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <IconMicrophone size={20} />
              </button>
              <button
                type="submit"
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={isLoading}
              >
                <IconSend size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingChatbot;
