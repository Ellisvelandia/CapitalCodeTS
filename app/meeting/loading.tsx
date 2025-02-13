import React from "react";
import { Loader2 } from "lucide-react";

export const Loading = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="p-6 rounded-xl border border-blue-200 dark:border-gray-700">
        <Loader2
          className="animate-spin w-10 h-10 text-blue-600 dark:text-blue-300"
          strokeWidth={3}
        />
      </div>
    </div>
  );
};

export default Loading;
