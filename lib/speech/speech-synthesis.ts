// Keep track of speaking state
let isSpeaking = false;
let hasInitialized = false;

// Helper: Detect iOS device
const isIOS = () => {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Helper: Initialize speech synthesis
const initializeSpeechSynthesis = () => {
  if (typeof window === "undefined" || !window.speechSynthesis || hasInitialized) return;
  
  // Force initialization of speech synthesis
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance('');
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
          window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
          resolve(updatedVoices);
        }
      };

      window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);

      // Fallback in case onvoiceschanged doesn't fire
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
        const fallbackVoices = window.speechSynthesis.getVoices();
        resolve(fallbackVoices.length > 0 ? fallbackVoices : []);
      }, 1000);
    }
  });
};

// Helper: Get the best available voice
const getVoice = async (lang: string = "es-ES"): Promise<SpeechSynthesisVoice | null> => {
  const voices = await initializeVoices();
  
  // Spanish language variations to try, prioritizing Spain Spanish
  const spanishVariants = [
    "es-ES", // Spain (prioritized)
    "es-US", // US Spanish
    "es-MX", // Mexico
    "es"     // Generic Spanish
  ];

  // Helper to check if it's the problematic male Mexican voice
  const isMaleMexicanVoice = (v: SpeechSynthesisVoice) => 
    v.lang === "es-MX" && 
    (v.name.toLowerCase().includes("jorge") || 
     v.name.toLowerCase().includes("juan") ||
     v.name.toLowerCase().includes("male"));

  if (isIOS()) {
    // For iOS, try to find the best Spanish voice
    return (
      // 1. Try to find Spanish (Spain) voice
      voices.find((v) => 
        v.lang === "es-ES" && 
        !isMaleMexicanVoice(v)
      ) ||
      // 2. Try to find Paulina
      voices.find((v) => 
        v.lang === "es-MX" && 
        v.name.includes("Paulina")
      ) ||
      // 3. Try any premium/enhanced Spanish voice (except male Mexican)
      voices.find((v) => 
        spanishVariants.includes(v.lang) && 
        !isMaleMexicanVoice(v) &&
        (v.name.toLowerCase().includes("premium") || v.name.toLowerCase().includes("enhanced"))
      ) ||
      // 4. Try any local Spanish voice (except male Mexican)
      voices.find((v) => 
        spanishVariants.includes(v.lang) && 
        v.localService && 
        !isMaleMexicanVoice(v)
      ) ||
      // 5. Any Spanish voice (except male Mexican)
      voices.find((v) => 
        spanishVariants.includes(v.lang) && 
        !isMaleMexicanVoice(v)
      ) ||
      null
    );
  }

  // For non-iOS devices
  return (
    // 1. Try Spanish (Spain) voices
    voices.find((v) => 
      v.lang === "es-ES" && 
      !isMaleMexicanVoice(v) &&
      (v.name.includes("Google") || v.name.includes("Microsoft"))
    ) ||
    // 2. Try Paulina specifically
    voices.find((v) => 
      v.lang === "es-MX" && 
      v.name.includes("Paulina")
    ) ||
    // 3. Try premium Spanish voices (except male Mexican)
    voices.find((v) => 
      spanishVariants.includes(v.lang) && 
      !isMaleMexicanVoice(v) &&
      (v.name.toLowerCase().includes("premium") || v.name.toLowerCase().includes("enhanced"))
    ) ||
    // 4. Try any Google/Microsoft Spanish voice (except male Mexican)
    voices.find((v) => 
      spanishVariants.includes(v.lang) && 
      !isMaleMexicanVoice(v) &&
      (v.name.includes("Google") || v.name.includes("Microsoft"))
    ) ||
    // 5. Any Spanish voice (except male Mexican)
    voices.find((v) => 
      spanishVariants.includes(v.lang) && 
      !isMaleMexicanVoice(v)
    ) ||
    null
  );
};

// Helper: Split text into smaller chunks
const splitIntoChunks = (text: string): string[] => {
  // First split by sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Then ensure each sentence is not too long (max 100 characters)
  const chunks: string[] = [];
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length <= 100) {
      chunks.push(trimmed);
    } else {
      // Split long sentences by commas
      const parts = trimmed.split(/,(?=\s)/);
      parts.forEach(part => {
        const trimmedPart = part.trim();
        if (trimmedPart.length <= 100) {
          chunks.push(trimmedPart);
        } else {
          // If still too long, split by spaces into ~50 char chunks
          let words = trimmedPart.split(' ');
          let currentChunk = '';
          
          words.forEach(word => {
            if ((currentChunk + ' ' + word).length <= 50) {
              currentChunk += (currentChunk ? ' ' : '') + word;
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
      voiceURI: voice.voiceURI
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
          utterance.rate = 0.950;    // Slightly slower for better clarity
          utterance.pitch = 1.1;    // Slightly higher pitch for better Spanish pronunciation
          utterance.volume = 1.0;   // Full volume
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
            const delay = isIOS() ? 300 : 400;  // Shorter delay for iOS
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
            lang: lang
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
            voiceURI: voice.voiceURI
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
