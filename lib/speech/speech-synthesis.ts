// Keep track of speaking state
let isSpeaking = false;

export const stopSpeaking = () => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }
};

// Helper: Detect iOS device
const isIOS = () => {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
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
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
      // Fallback in case onvoiceschanged doesn't fire
      setTimeout(() => {
        const fallbackVoices = window.speechSynthesis.getVoices();
        if (fallbackVoices.length > 0) {
          resolve(fallbackVoices);
        } else {
          resolve([]);
        }
      }, 1000);
    }
  });
};

// Helper: Get the best available voice
const getVoice = async (lang: string = "es-ES"): Promise<SpeechSynthesisVoice | null> => {
  const voices = await initializeVoices();
  
  // Quality voice providers
  const preferredProviders = ["Google", "Microsoft", "Natural"];
  
  // Try to find the best quality voice in the following order:
  return (
    // 1. Premium/enhanced voice in exact language
    voices.find((v) => 
      v.lang === lang && 
      (v.name.toLowerCase().includes("premium") || 
       v.name.toLowerCase().includes("enhanced") ||
       preferredProviders.some(provider => v.name.includes(provider)))
    ) ||
    // 2. Any Google/Microsoft voice in exact language
    voices.find((v) => 
      v.lang === lang && 
      preferredProviders.some(provider => v.name.includes(provider))
    ) ||
    // 3. Any voice in exact language
    voices.find((v) => v.lang === lang) ||
    // 4. Premium/enhanced voice in base language
    voices.find((v) => 
      v.lang.startsWith(lang.split("-")[0]) && 
      (v.name.toLowerCase().includes("premium") || 
       v.name.toLowerCase().includes("enhanced") ||
       preferredProviders.some(provider => v.name.includes(provider)))
    ) ||
    // 5. Any voice in base language
    voices.find((v) => v.lang.startsWith(lang.split("-")[0])) ||
    // 6. First available voice as last resort
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
    // Use smaller chunks for iOS to prevent cutting off
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
          utterance.rate = 0.9;  // Slightly slower on iOS
          utterance.pitch = 1.0;
          utterance.volume = 0.9;
        } else {
          utterance.rate = 1.1;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
        }

        utterance.onend = () => {
          // iOS specific handling
          if (isIOS()) {
            resetSpeechSynthesis();
          }
          // Ensure speech synthesis is not paused
          else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          
          if (index < chunks.length - 1) {
            // Longer pause between chunks on iOS
            const delay = isIOS() ? 600 : 400;
            setTimeout(() => speakChunk(index + 1), delay);
          } else {
            isSpeaking = false;
          }
        };

        utterance.onerror = (event) => {
          const error = event as SpeechSynthesisErrorEvent;
          if (error.error !== 'interrupted' && error.error !== 'canceled') {
            console.debug("Speech chunk completed with non-critical error:", {
              chunk: index,
              error: error.error
            });
            
            // Try to recover on iOS
            if (isIOS()) {
              resetSpeechSynthesis();
            }
          }
          
          if (index < chunks.length - 1) {
            const delay = isIOS() ? 600 : 400;
            setTimeout(() => speakChunk(index + 1), delay);
          } else {
            isSpeaking = false;
          }
        };

        // Resume synthesis if it was paused
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        // Additional iOS check before speaking
        if (isIOS()) {
          resetSpeechSynthesis();
        }

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Error creating utterance for chunk", index, ":", error);
        if (index < chunks.length - 1) {
          const delay = isIOS() ? 600 : 400;
          setTimeout(() => speakChunk(index + 1), delay);
        } else {
          isSpeaking = false;
        }
      }
    };

    isSpeaking = true;
    speakChunk(0);

  } catch (error) {
    console.error("Error in speech synthesis:", error);
    isSpeaking = false;
  }
};
