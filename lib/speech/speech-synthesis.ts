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
  
  if (isIOS()) {
    // On iOS, prefer local voices as they are more reliable
    return (
      // First try to find a local voice in the exact language
      voices.find((v) => v.lang === lang && v.localService) ||
      // Then try any voice in the exact language
      voices.find((v) => v.lang === lang) ||
      // Then try local voice in base language
      voices.find((v) => v.lang.startsWith(lang.split("-")[0]) && v.localService) ||
      // Then any voice in base language
      voices.find((v) => v.lang.startsWith(lang.split("-")[0])) ||
      // Finally, just get any available voice
      voices[0] ||
      null
    );
  }

  // For non-iOS devices, keep the existing logic
  const preferredProviders = ["Google", "Microsoft", "Natural"];
  
  return (
    voices.find((v) => 
      v.lang === lang && 
      (v.name.toLowerCase().includes("premium") || 
       v.name.toLowerCase().includes("enhanced") ||
       preferredProviders.some(provider => v.name.includes(provider)))
    ) ||
    voices.find((v) => 
      v.lang === lang && 
      preferredProviders.some(provider => v.name.includes(provider))
    ) ||
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => 
      v.lang.startsWith(lang.split("-")[0]) && 
      (v.name.toLowerCase().includes("premium") || 
       v.name.toLowerCase().includes("enhanced") ||
       preferredProviders.some(provider => v.name.includes(provider)))
    ) ||
    voices.find((v) => v.lang.startsWith(lang.split("-")[0])) ||
    voices[0] ||
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
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;  // Set to full volume for iOS
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
          console.debug("Speaking on iOS:", {
            voiceName: voice.name,
            voiceLang: voice.lang,
            isLocal: voice.localService
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
