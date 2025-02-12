import { FaPaperPlane } from "react-icons/fa";

interface ChatInputProps {
    inputMessage: string;
    setInputMessage: (msg: string) => void;
    isLoading: boolean;
    handleSend: (e: React.FormEvent) => void;
}

export default function ChatInput({ inputMessage, setInputMessage, isLoading, handleSend }: ChatInputProps) {
    return (
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
    );
}
