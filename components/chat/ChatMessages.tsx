import React from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
    type: "user" | "bot";
    content: string;
    language?: string;
}

interface ChatMessagesProps {
    messages: ChatMessage[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function ChatMessages({ messages, isLoading, messagesEndRef }: ChatMessagesProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl ${message.type === "user" ? "bg-black text-white rounded-br-none" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none"}`}>
                        {message.type === "bot" ? (
                            <ReactMarkdown
                                className="whitespace-pre-wrap prose dark:prose-invert max-w-none prose-sm"
                                components={{
                                    a: ({ node, ...props }) => {
                                        const href = props.href === "proyectos" ? "/showcase" : props.href === "llamada" ? "/meeting" : props.href;
                                        return (
                                            <a
                                                {...props}
                                                className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (href) window.location.href = href;
                                                }}
                                            />
                                        );
                                    },
                                    em: ({ node, ...props }) => <span {...props} className="underline decoration-2" />,
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
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
    );
}
