// Keep track of speaking state
let isSpeaking = false;
let hasInitialized = false;

// Helper: Detect iOS device
const isIOS = () => {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  );
};

// Helper: Initialize speech synthesis
const initializeSpeechSynthesis = () => {
  if (
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    hasInitialized
  )
    return;

  // Force initialization of speech synthesis
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance("");
  window.speechSynthesis.speak(utterance);
  window.speechSynthesis.cancel();
  hasInitialized = true;
};

// Helper: Reset and resume speech synthesis (iOS workaround)
const resetSpeechSynthesis = () => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
};

// Helper: Initialize voices and return a promise
const initializeVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    // Initialize speech synthesis first
    initializeSpeechSynthesis();

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      // Set up event listener for voices changed
      const voicesChangedHandler = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        if (updatedVoices.length > 0) {
          window.speechSynthesis.removeEventListener(
            "voiceschanged",
            voicesChangedHandler
          );
          resolve(updatedVoices);
        }
      };

      window.speechSynthesis.addEventListener(
        "voiceschanged",
        voicesChangedHandler
      );

      // Fallback in case onvoiceschanged doesn't fire
      setTimeout(() => {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          voicesChangedHandler
        );
        const fallbackVoices = window.speechSynthesis.getVoices();
        resolve(fallbackVoices.length > 0 ? fallbackVoices : []);
      }, 1000);
    }
  });
};

// Helper: Get the best available voice
const getVoice = async (
  lang: string = "es-ES"
): Promise<SpeechSynthesisVoice | null> => {
  const voices = await initializeVoices();

  // Spanish language variations to try, prioritizing Spain Spanish
  const spanishVariants = [
    "es-ES", // Spain (prioritized)
    "es-US", // US Spanish
    "es", // Generic Spanish
  ];

  // Helper to check if it's a male voice
  const isMaleVoice = (v: SpeechSynthesisVoice) =>
    v.name.toLowerCase().includes("male");

  // Helper: Check if voice is likely to be high quality
  const isHighQualityVoice = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase();
    return (
      name.includes('google') ||
      name.includes('premium') ||
      name.includes('enhanced') ||
      (v.localService && !name.includes('compact'))
    );
  };

  // Log available voices for debugging
  console.debug('Available Spanish voices:', voices.filter(v => 
    v.lang.startsWith('es')).map(v => ({
      name: v.name,
      lang: v.lang,
      isLocal: v.localService,
      isDefault: v.default
    }))
  );

  // Check if we're in Firefox
  const isFirefox = typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes('firefox');

  if (isFirefox) {
    // For Firefox, prioritize Spanish voices
    const firefoxVoice = 
      // 1. Try to find any Spanish (Spain) voice
      voices.find((v) => 
        v.lang === "es-ES" && 
        !isMaleVoice(v) &&
        v.localService // Prefer local voices for better performance
      ) ||
      // 2. Try any Spanish voice from Spain
      voices.find((v) => 
        v.lang === "es-ES" && 
        !isMaleVoice(v)
      ) ||
      // 3. Try any Spanish voice
      voices.find((v) => 
        spanishVariants.includes(v.lang) && 
        !isMaleVoice(v)
      );
    
    return firefoxVoice || null;
  }

  if (isIOS()) {
    // For iOS, try to find the best possible voice
    const bestVoice = voices.find(
      (v) =>
        v.lang === "es-ES" &&
        !isMaleVoice(v) &&
        isHighQualityVoice(v)
    );

    if (bestVoice) {
      console.debug('Selected high-quality iOS voice:', {
        name: bestVoice.name,
        lang: bestVoice.lang,
        isLocal: bestVoice.localService
      });
      return bestVoice;
    }

    // If no high-quality voice found, try any Spanish voice
    const fallbackVoice = voices.find(
      (v) =>
        spanishVariants.includes(v.lang) &&
        !isMaleVoice(v)
    ) || null;

    if (fallbackVoice) {
      console.debug('Using fallback iOS voice:', {
        name: fallbackVoice.name,
        lang: fallbackVoice.lang,
        isLocal: fallbackVoice.localService
      });
    }

    return fallbackVoice;
  }

  // For non-iOS devices
  const foundVoice = 
    // 1. Try Spanish (Spain) voices
    voices.find(
      (v) =>
        v.lang === "es-ES" &&
        !isMaleVoice(v) &&
        (v.name.includes("Google") || v.name.includes("Microsoft"))
    ) ||
    // 2. Try premium Spanish voices
    voices.find(
      (v) =>
        spanishVariants.includes(v.lang) &&
        !isMaleVoice(v) &&
        (v.name.toLowerCase().includes("premium") || v.name.toLowerCase().includes("enhanced"))
    ) ||
    // 3. Try any Google/Microsoft Spanish voice
    voices.find(
      (v) =>
        spanishVariants.includes(v.lang) &&
        !isMaleVoice(v) &&
        (v.name.includes("Google") || v.name.includes("Microsoft"))
    ) ||
    // 4. Any Spanish voice
    voices.find(
      (v) => spanishVariants.includes(v.lang) && !isMaleVoice(v)
    );
    
  return foundVoice || null;
};

// Helper: Split text into smaller chunks
const splitIntoChunks = (text: string): string[] => {
  // First split by sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  // Then ensure each sentence is not too long (max 100 characters)
  const chunks: string[] = [];
  sentences.forEach((sentence) => {
    const trimmed = sentence.trim();
    if (trimmed.length <= 100) {
      chunks.push(trimmed);
    } else {
      // Split long sentences by commas
      const parts = trimmed.split(/,(?=\s)/);
      parts.forEach((part) => {
        const trimmedPart = part.trim();
        if (trimmedPart.length <= 100) {
          chunks.push(trimmedPart);
        } else {
          // If still too long, split by spaces into ~50 char chunks
          let words = trimmedPart.split(" ");
          let currentChunk = "";

          words.forEach((word) => {
            if ((currentChunk + " " + word).length <= 50) {
              currentChunk += (currentChunk ? " " : "") + word;
            } else {
              if (currentChunk) chunks.push(currentChunk);
              currentChunk = word;
            }
          });

          if (currentChunk) {
            chunks.push(currentChunk);
          }
        }
      });
    }
  });

  return chunks;
};

export const stopSpeaking = () => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }
};

export const speakMessage = async (
  text: string,
  isMuted: boolean = false,
  lang: string = "es-ES"
) => {
  if (
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    isMuted ||
    isSpeaking ||
    !text
  ) {
    return;
  }

  try {
    // Initialize speech synthesis if needed
    initializeSpeechSynthesis();

    // Cancel any ongoing speech
    stopSpeaking();

    // Reset speech synthesis for iOS
    if (isIOS()) {
      resetSpeechSynthesis();
    }

    // Get voice first to ensure it's available
    const voice = await getVoice(lang);
    if (!voice) {
      console.warn("No voice available for language:", lang);
      return;
    }

    // Log selected voice info for debugging
    console.debug("Selected Spanish voice:", {
      name: voice.name,
      lang: voice.lang,
      isLocal: voice.localService,
      voiceURI: voice.voiceURI,
    });

    // Split text into manageable chunks
    const chunks = splitIntoChunks(text);

    const speakChunk = (index: number) => {
      if (index >= chunks.length) {
        isSpeaking = false;
        return;
      }

      const chunk = chunks[index];
      if (!chunk) {
        speakChunk(index + 1);
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.voice = voice;
        utterance.lang = lang;

        // Adjust parameters for iOS
        if (isIOS()) {
          // Use more natural-sounding parameters
          utterance.rate = 1.0;      // Normal speed
          utterance.pitch = 1.0;     // Natural pitch
          utterance.volume = 1.0;    // Full volume
          
          // Add some subtle improvements
          if (typeof utterance.voice !== 'undefined' && utterance.voice) {
            console.debug('Using voice settings:', {
              name: utterance.voice.name,
              rate: utterance.rate,
              pitch: utterance.pitch
            });
          }
        } else {
          utterance.rate = 1.1;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
        }

        utterance.onend = () => {
          if (isIOS()) {
            resetSpeechSynthesis();
          } else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          if (index < chunks.length - 1) {
            const delay = isIOS() ? 300 : 400; // Shorter delay for iOS
            setTimeout(() => speakChunk(index + 1), delay);
          } else {
            isSpeaking = false;
          }
        };

        utterance.onerror = (event) => {
          const error = event as SpeechSynthesisErrorEvent;
          console.debug("Speech error:", {
            chunk: index,
            error: error.error,
            voice: voice.name,
            lang: lang,
          });

          if (isIOS()) {
            resetSpeechSynthesis();
          }

          if (index < chunks.length - 1) {
            const delay = isIOS() ? 300 : 400;
            setTimeout(() => speakChunk(index + 1), delay);
          } else {
            isSpeaking = false;
          }
        };

        // iOS requires a user gesture to start speech
        // We'll try to speak anyway, but warn in console
        if (isIOS()) {
          console.debug("Selected Spanish voice:", {
            name: voice.name,
            lang: voice.lang,
            isLocal: voice.localService,
            voiceURI: voice.voiceURI,
          });
        }

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Error speaking chunk:", error);
        if (index < chunks.length - 1) {
          setTimeout(() => speakChunk(index + 1), 300);
        } else {
          isSpeaking = false;
        }
      }
    };

    isSpeaking = true;
    speakChunk(0);
  } catch (error) {
    console.error("Error in speakMessage:", error);
    isSpeaking = false;
  }
};
