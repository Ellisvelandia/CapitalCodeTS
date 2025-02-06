export const speakMessage = (
  text: string,
  isMuted: boolean = false,
  lang: string = "es-ES"
) => {
  if (isMuted || typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  // Cancel any ongoing speech and wait a brief moment
  window.speechSynthesis.cancel();
  setTimeout(() => {
    // Helper: find a matching voice for the given language.
    const getVoice = (): SpeechSynthesisVoice | null => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;
      return (
        voices.find((v) => v.lang === lang && v.name.includes("Google")) || // Google voice
        voices.find((v) => v.lang === lang) || // Any voice with the exact language match
        voices.find((v) => v.lang.startsWith("es")) || // Any Spanish variant
        voices[0] // Fallback to the first available voice
      );
    };

    // Split the text into sentences to allow natural pauses.
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentIndex = 0;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const speakNextSentence = () => {
      if (currentIndex >= sentences.length) return; // Finished all sentences

      const voice = getVoice();
      if (!voice) {
        console.warn("No voice available - waiting for voices to load");
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(speakNextSentence, 1000);
        }
        return;
      }

      const sentence = sentences[currentIndex].trim();
      if (!sentence) {
        console.warn("Empty sentence encountered, skipping...");
        currentIndex++;
        speakNextSentence();
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.voice = voice;
        utterance.lang = lang;
        utterance.rate = 1.1; // Slightly slower rate
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Reset retry count when speech starts successfully
        utterance.onstart = () => {
          retryCount = 0;
        };

        // Proceed to the next sentence when this one ends
        utterance.onend = () => {
          currentIndex++;
          if (currentIndex < sentences.length) {
            setTimeout(() => speakNextSentence(), 250); // Slight pause between sentences
          }
        };

        // Handle errors during speech
        utterance.onerror = (event: any) => {
          // If the error is "interrupted", then we know this utterance was cancelled intentionally.
          if (event.error && event.error.toLowerCase() === "interrupted") {
            console.warn(
              "Speech synthesis was intentionally interrupted:",
              event
            );
            currentIndex++;
            speakNextSentence();
            return;
          }
          // Log other errors and apply retry logic if needed
          console.error("Speech synthesis error:", event);
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying speech synthesis (attempt ${retryCount})`);
            setTimeout(() => {
              speakNextSentence();
            }, 1000);
          } else {
            currentIndex++;
            retryCount = 0;
            speakNextSentence();
          }
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Error creating utterance:", error);
        currentIndex++;
        speakNextSentence();
      }
    };

    // Wait for voices to load if not available immediately.
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakNextSentence();
      };
      // Fallback if onvoiceschanged doesn't fire
      setTimeout(speakNextSentence, 1000);
    } else {
      speakNextSentence();
    }
  }, 100); // Short delay after canceling prior speech

  // Return a cleanup function in case you need to cancel later.
  return () => {
    window.speechSynthesis.cancel();
  };
};
