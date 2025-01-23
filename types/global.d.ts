declare global {
    interface Window {
      webkitSpeechRecognition: typeof SpeechRecognition;
      SpeechRecognition: typeof SpeechRecognition;
    }
  }
  
  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    interpretation?: any;
    emma?: Document | null;
  }