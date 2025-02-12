import { useState, useEffect, useRef } from "react";
import { speakMessage, stopSpeaking } from "@/lib/speech/speech-synthesis";

export interface ChatMessage {
  type: "user" | "bot";
  content: string;
  language?: string;
}

export const useChat = () => {
	// ...existing code: state initializations...
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

	return {
		isOpen,
		isMuted,
		isExpanded,
		inputMessage,
		messages,
		isLoading,
		messagesEndRef,
		quickQuestions,
		setInputMessage,
		handleQuickQuestion,
		handleSend,
		toggleChat,
		toggleExpand,
		toggleMute,
	};
};
