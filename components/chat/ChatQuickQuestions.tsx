interface ChatQuickQuestionsProps {
    quickQuestions: string[];
    handleQuickQuestion: (question: string) => void;
}

export default function ChatQuickQuestions({ quickQuestions, handleQuickQuestion }: ChatQuickQuestionsProps) {
    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => handleQuickQuestion(q)}
                        className="text-xs bg-black/5 hover:bg-black/10 text-black dark:text-white px-3 py-1.5 rounded-full transition-colors"
                        aria-label={`Pregunta rápida: ${q}`}
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );
}
