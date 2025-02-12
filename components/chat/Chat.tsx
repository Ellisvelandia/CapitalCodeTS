"use client";
import { X, MessageCircle } from "lucide-react";
import { ChatHeader, ChatMessages, ChatQuickQuestions, ChatInput } from "./index";
import { useChat } from "@/hooks/useChat";

export default function Chat() {
	const {
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
	} = useChat();

	return (
		<div className={`fixed ${isExpanded ? "inset-0 z-50" : "bottom-8 right-8 z-50"} ${isOpen ? "animate-fade-in" : ""} transition-all duration-300`}>
			{!isExpanded && (
				<button onClick={toggleChat} className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all focus:outline-none" aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}>
					{isOpen ? <X size={28} /> : <MessageCircle size={28} />}
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
