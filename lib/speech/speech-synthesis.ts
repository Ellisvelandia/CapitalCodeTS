// Keep track of speaking state and current utterance
let isSpeaking = false;
let hasInitialized = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;

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
    "es-MX", // Mexican Spanish
    "es-US", // US Spanish
    "es"     // Generic Spanish
  ];

  // Helper to check if it's a male voice
  const isMaleVoice = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase();
    return (
      name.includes("male") ||
      name.includes("carlos") ||
      name.includes("juan") ||
      name.includes("diego") ||
      // Specific check for Mexican male Google voice
      (name.includes("google") && 
       name.includes("es-mx") && 
       (name.includes("man") || name.includes("male")))
    );
  };

  // Helper: Check if voice is likely to be high quality
  const isHighQualityVoice = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase();
    return (
      (name.includes('google') && v.lang === 'es-ES') || // Prioritize Google Spanish (Spain)
      name.includes('microsoft') ||
      name.includes('premium') ||
      name.includes('enhanced') ||
      name.includes('neural') ||
      (name.includes('paulina') && name.includes('mobile')) || // High quality Mexican voice
      (v.localService && !name.includes('compact'))
    );
  };

  // Helper: Check if voice is natural-sounding
  const isNaturalVoice = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase();
    return (
      name.includes('natural') ||
      name.includes('neural') ||
      name.includes('premium') ||
      name.includes('enhanced') ||
      name.includes('paulina') ||
      name.includes('google') ||
      name.includes('microsoft')
    );
  };

  // Helper: Check if it's Chrome browser
  const isChrome = () => {
    return typeof window !== "undefined" && 
           navigator.userAgent.toLowerCase().includes('chrome') &&
           !navigator.userAgent.toLowerCase().includes('edge');
  };

  // Helper: Check if it's Safari browser
  const isSafari = () => {
    return typeof window !== "undefined" && 
           navigator.userAgent.toLowerCase().includes('safari') &&
           !navigator.userAgent.toLowerCase().includes('chrome');
  };

  // Helper: Rate the voice quality for iOS (0-10)
  const getIOSVoiceQualityScore = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    let score = 0;

    // Base score for language
    if (v.lang === 'es-ES') score += 3;
    
    // Premium voices typically have these indicators
    if (name.includes('premium')) score += 2;
    if (name.includes('enhanced')) score += 2;
    if (name.includes('natural')) score += 2;
    
    // Known high-quality iOS voices
    if (name.includes('mónica') || name.includes('monica')) score += 3;
    if (name.includes('jorge') && v.lang === 'es-ES') score += 2;
    
    // Built-in iOS indicators
    if (v.localService) score += 1;
    if (name.includes('siri')) score += 1;
    
    // Prefer non-compact voices
    if (name.includes('compact')) score -= 2;
    
    return Math.min(10, Math.max(0, score));
  };

  // Log available voices for debugging
  console.debug('Available Spanish voices:', voices.filter(v => 
    v.lang.startsWith('es')).map(v => ({
      name: v.name,
      lang: v.lang,
      isLocal: v.localService,
      isDefault: v.default,
      isHighQuality: isHighQualityVoice(v),
      isNatural: isNaturalVoice(v)
    }))
  );

  // For Chrome, prioritize Google Spanish (Spain) voice
  if (isChrome()) {
    const googleSpainVoice = voices.find(
      (v) =>
        v.name.toLowerCase().includes('google') &&
        v.lang === 'es-ES' &&
        !isMaleVoice(v)
    );

    if (googleSpainVoice) {
      console.debug('Selected Google Spanish (Spain) voice:', {
        name: googleSpainVoice.name,
        lang: googleSpainVoice.lang,
        isLocal: googleSpainVoice.localService
      });
      return googleSpainVoice;
    }
  }

  // Check if we're in Firefox
  const isFirefox = typeof window !== "undefined" && navigator.userAgent.toLowerCase().includes('firefox');

  if (isFirefox) {
    // For Firefox, prioritize high-quality Spanish voices
    const firefoxVoice = 
      // 1. Try to find high-quality Spanish voice
      voices.find((v) => 
        spanishVariants.includes(v.lang) && 
        !isMaleVoice(v) &&
        isHighQualityVoice(v)
      ) ||
      // 2. Try natural-sounding Spanish voice
      voices.find((v) => 
        spanishVariants.includes(v.lang) && 
        !isMaleVoice(v) &&
        isNaturalVoice(v)
      ) ||
      // 3. Try any Spanish voice
      voices.find((v) => 
        spanishVariants.includes(v.lang) && 
        !isMaleVoice(v)
      );
    
    return firefoxVoice || null;
  }

  if (isIOS()) {
    // Special handling for iOS Safari
    if (isSafari()) {
      // Get all Spanish voices and sort by quality score
      const spanishVoices = voices
        .filter(v => 
          v.lang.startsWith('es') && 
          !isMaleVoice(v))
        .sort((a, b) => {
          const scoreA = getIOSVoiceQualityScore(a);
          const scoreB = getIOSVoiceQualityScore(b);
          return scoreB - scoreA; // Sort by highest score first
        });

      if (spanishVoices.length > 0) {
        const bestVoice = spanishVoices[0];
        const score = getIOSVoiceQualityScore(bestVoice);
        
        console.debug('Selected best iOS Safari voice:', {
          name: bestVoice.name,
          lang: bestVoice.lang,
          isLocal: bestVoice.localService,
          qualityScore: score,
          allScores: spanishVoices.map(v => ({
            name: v.name,
            score: getIOSVoiceQualityScore(v)
          }))
        });
        
        return bestVoice;
      }
    }

    // For other iOS browsers or if no Safari voices found
    const spainVoice = voices.find(
      (v) =>
        v.lang === "es-ES" &&
        !isMaleVoice(v) &&
        (v.name.toLowerCase().includes('mónica') || 
         v.name.toLowerCase().includes('monica') ||
         (v.name.toLowerCase().includes('siri') && v.localService) ||
         v.name.toLowerCase().includes('spain'))
    );

    if (spainVoice) {
      console.debug('Selected Spanish (Spain) iOS voice:', {
        name: spainVoice.name,
        lang: spainVoice.lang,
        isLocal: spainVoice.localService,
        qualityScore: getIOSVoiceQualityScore(spainVoice)
      });
      return spainVoice;
    }

    // If no Spain voice found, try to find the best possible voice
    const bestVoice = 
      // 1. Try high-quality local voices
      voices.find(
        (v) =>
          v.lang === "es-ES" &&
          !isMaleVoice(v) &&
          v.localService &&
          getIOSVoiceQualityScore(v) >= 5
      ) ||
      // 2. Try any high-quality Spanish voice
      voices.find(
        (v) =>
          v.lang === "es-ES" &&
          !isMaleVoice(v) &&
          getIOSVoiceQualityScore(v) >= 3
      );

    if (bestVoice) {
      console.debug('Selected high-quality voice:', {
        name: bestVoice.name,
        lang: bestVoice.lang,
        isLocal: bestVoice.localService,
        qualityScore: getIOSVoiceQualityScore(bestVoice)
      });
      return bestVoice;
    }

    // Last resort: any Spanish voice with decent quality
    const fallbackVoice = voices.find(
      (v) =>
        v.lang.startsWith('es') &&
        !isMaleVoice(v) &&
        getIOSVoiceQualityScore(v) > 0
    ) || null;

    if (fallbackVoice) {
      console.debug('Using fallback Spanish voice:', {
        name: fallbackVoice.name,
        lang: fallbackVoice.lang,
        isLocal: fallbackVoice.localService,
        qualityScore: getIOSVoiceQualityScore(fallbackVoice)
      });
    }

    return fallbackVoice;
  }

  // For non-iOS devices
  const foundVoice = 
    // 1. Try high-quality Spanish voices
    voices.find(
      (v) =>
        spanishVariants.includes(v.lang) &&
        !isMaleVoice(v) &&
        isHighQualityVoice(v) &&
        (v.name.includes("Google") || v.name.includes("Microsoft"))
    ) ||
    // 2. Try natural-sounding Spanish voices
    voices.find(
      (v) =>
        spanishVariants.includes(v.lang) &&
        !isMaleVoice(v) &&
        isNaturalVoice(v)
    ) ||
    // 3. Try any Spanish voice from our preferred variants
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

// Helper: Clean text for speech synthesis
const cleanTextForSpeech = (text: string): string => {
  // Handle email addresses - replace underscores with spaces and add pauses
  text = text.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, (email) => {
    return email
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/([a-zA-Z0-9]+)@([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)/gi, '$1 at $2 dot $3') // Make email more speakable
      .replace(/\./g, ' dot '); // Replace remaining dots with "dot"
  });

  // Clean other special characters and formatting
  text = text
    .replace(/\*\*/g, '')  // Remove bold markdown
    .replace(/\*/g, '')    // Remove italic markdown
    .replace(/`/g, '')     // Remove code markdown
    .replace(/\n/g, ', ')  // Replace newlines with pauses
    .replace(/\s+/g, ' ')  // Normalize spaces
    .trim();

  return text;
};

// Helper: Stop speaking and clean up
export const stopSpeaking = () => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  
  // Cancel any ongoing speech synthesis
  window.speechSynthesis.cancel();
  
  // Remove event listeners from current utterance if it exists
  if (currentUtterance) {
    currentUtterance.onend = null;
    currentUtterance.onerror = null;
    currentUtterance = null;
  }
  
  isSpeaking = false;
  
  // Reset speech synthesis for iOS
  if (isIOS()) {
    resetSpeechSynthesis();
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
    !text
  ) {
    return;
  }

  try {
    // Stop any ongoing speech first
    stopSpeaking();
    
    // Clean the text before speaking
    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    // Initialize speech synthesis if needed
    initializeSpeechSynthesis();

    // Get voice first to ensure it's available
    const voice = await getVoice(lang);
    if (!voice) {
      console.warn("No voice available for language:", lang);
      return;
    }

    // Split text into manageable chunks
    const chunks = splitIntoChunks(cleanedText);

    const speakChunk = (index: number) => {
      // Don't continue if speech was stopped
      if (!isSpeaking || index >= chunks.length) {
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
        currentUtterance = utterance;  // Store current utterance
        utterance.voice = voice;
        utterance.lang = lang;

        // Adjust parameters for iOS
        if (isIOS()) {
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
        } else {
          utterance.rate = 1.1;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
        }

        utterance.onend = () => {
          // Don't continue if speech was stopped
          if (!isSpeaking) return;
          
          if (isIOS()) {
            resetSpeechSynthesis();
          }

          if (index < chunks.length - 1) {
            setTimeout(() => speakChunk(index + 1), isIOS() ? 300 : 400);
          } else {
            stopSpeaking();
          }
        };

        utterance.onerror = (event) => {
          console.error("Speech error:", event);
          stopSpeaking();
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Error speaking chunk:", error);
        stopSpeaking();
      }
    };

    isSpeaking = true;
    speakChunk(0);
  } catch (error) {
    console.error("Error in speakMessage:", error);
    stopSpeaking();
  }
};
