import { FaTimes, FaExpandAlt, FaCompressAlt, FaVolumeUp, FaVolumeMute } from "react-icons/fa";

interface ChatHeaderProps {
    isExpanded: boolean;
    isMuted: boolean;
    toggleChat: () => void;
    toggleExpand: () => void;
    toggleMute: () => void;
}

export default function ChatHeader({ isExpanded, isMuted, toggleChat, toggleExpand, toggleMute }: ChatHeaderProps) {
    return (
        <div className="p-4 bg-black text-white flex items-center justify-between rounded-t-xl shadow-md">
            <div className="flex items-center gap-2">
                {isExpanded && (
                    <button onClick={toggleChat} className="p-1.5 hover:bg-gray-800 rounded-full focus:outline-none" aria-label="Cerrar chat">
                        <FaTimes size={20} />
                    </button>
                )}
                <button onClick={toggleExpand} aria-label={isExpanded ? "Minimizar chat" : "Expandir chat"} className="p-1.5 hover:bg-gray-800 rounded-full focus:outline-none">
                    {isExpanded ? <FaCompressAlt size={20} /> : <FaExpandAlt size={20} />}
                </button>
            </div>
            <button onClick={toggleMute} aria-label={isMuted ? "Activar sonido" : "Silenciar"} className="p-1.5 hover:bg-gray-800 rounded-full focus:outline-none">
                {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
            </button>
        </div>
    );
}
