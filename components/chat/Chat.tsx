"use client";
import { useState, useEffect, useRef } from "react";
import { FaTimes, FaComment } from "react-icons/fa";
import { speakMessage, stopSpeaking } from "@/lib/speech/speech-synthesis";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatQuickQuestions from "./ChatQuickQuestions";
import ChatInput from "./ChatInput";

interface ChatMessage {
  type: "user" | "bot";
  content: string;
  language?: string;
}

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "¿Qué servicios ofrecen?",
    "¿Cuáles son los precios?",
    "Agenda una reunión",
    "¿Qué garantías tienen?",
    "¿Cómo contactar con soporte?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleQuickQuestion = (question: string) => {
    stopSpeaking();
    setInputMessage(question);
    handleSend(new Event("submit") as any);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastSentTime < 3000) {
      alert("Por favor, espera unos momentos antes de enviar otro mensaje");
      return;
    }
    stopSpeaking();
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
          messages: [...messages, newUserMessage].map((msg) => ({
            role: msg.type === "bot" ? "assistant" : "user",
            content: msg.content,
          })),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error details:", errorData);
        if (response.status === 429) {
          throw new Error("Estamos recibiendo muchas solicitudes. Por favor, inténtalo de nuevo en unos minutos.");
        }
        throw new Error(errorData.error || "Error del servidor");
      }
      const data = await response.json();
      if (!data.content) {
        throw new Error("No se recibió respuesta del servidor");
      }
      const handleBotResponse = async (response: any) => {
        if (response?.content) {
          const newMessage: ChatMessage = {
            type: "bot",
            content: response.content,
            language: response.language || "es-ES",
          };
          setMessages((prev) => [...prev, newMessage]);
          if (!isMuted) {
            const cleanedText = response.content
              .replace(/\*\*/g, "")
              .replace(/\*/g, "")
              .replace(/`/g, "")
              .replace(/\n/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            await speakMessage(cleanedText, false, newMessage.language);
          }
        }
      };
      await handleBotResponse(data);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = error.message || "Ocurrió un error inesperado";
      const botMsg: ChatMessage = { type: "bot", content: `⚠️ ${errorMsg}` };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLastSentTime(Date.now());
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    if (isExpanded) {
      setIsExpanded(false);
      setTimeout(() => setIsOpen(false), 300);
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  const toggleExpand = () => setIsExpanded((prev) => !prev);
  const toggleMute = () => { stopSpeaking(); setIsMuted(!isMuted); };

  return (
    <div className={`fixed ${isExpanded ? "inset-0 z-50" : "bottom-8 right-8 z-50"} ${isOpen ? "animate-fade-in" : ""} transition-all duration-300`}>
      {!isExpanded && (
        <button onClick={toggleChat} className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all focus:outline-none" aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}>
          {isOpen ? <FaTimes size={28} /> : <FaComment size={28} />}
        </button>
      )}
      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="chatbot-heading"
          className={`${isExpanded ? "fixed inset-0 w-full h-full" : "fixed bottom-24 right-4 w-full max-w-xs sm:max-w-md h-[70vh]"} bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col transition-all duration-300`}
        >
          <ChatHeader isExpanded={isExpanded} isMuted={isMuted} toggleChat={toggleChat} toggleExpand={toggleExpand} toggleMute={toggleMute} />
          <ChatMessages messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} />
          <ChatQuickQuestions quickQuestions={quickQuestions} handleQuickQuestion={handleQuickQuestion} />
          <ChatInput inputMessage={inputMessage} setInputMessage={setInputMessage} isLoading={isLoading} handleSend={handleSend} />
        </div>
      )}
    </div>
  );
}
