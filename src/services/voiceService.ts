import type { SupportedLanguage } from "../context/LanguageContext";

/**
 * Text-to-Speech (TTS) synthesizer for smallholder farmers.
 * Works across desktop and mobile browsers using the standard Web Speech API.
 */
export function speakText(
  text: string,
  language: SupportedLanguage = "en",
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (!("speechSynthesis" in window)) {
    console.warn("SpeechSynthesis is not supported in this browser.");
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Map language codes
  switch (language) {
    case "sw":
      utterance.lang = "sw-KE";
      break;
    case "lg":
      utterance.lang = "lg-UG";
      break;
    case "nyn":
      utterance.lang = "nyn-UG";
      break;
    case "en":
    default:
      utterance.lang = "en-GB";
      break;
  }

  utterance.rate = 0.88; // Slightly measured rate for clear agricultural comprehension
  utterance.pitch = 1.0;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Speech-to-Text (STT) voice recognizer.
 */
interface SpeechRecognitionAlternativeLike { transcript: string }
type SpeechRecognitionResultLike = ArrayLike<SpeechRecognitionAlternativeLike>;
interface SpeechRecognitionResultEventLike extends Event { results: ArrayLike<SpeechRecognitionResultLike> }
interface SpeechRecognitionErrorEventLike extends Event { error: string }
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function startVoiceRecognition(
  onResult: (transcript: string) => void,
  onError: (errorMsg: string) => void,
  onEnd: () => void,
  language: SupportedLanguage = "en"
): { stop: () => void; isSupported: boolean } {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      stop: () => {},
      isSupported: false,
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = language === "lg" ? "lg-UG" : language === "sw" ? "sw-KE" : language === "nyn" ? "nyn-UG" : "en-UG";

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript || "";
    onResult(transcript);
  };

  recognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    const message = event.error === "network"
      ? "Voice typing could not connect to your browser's speech recognition service. Check your internet connection and try again, or type your notes."
      : event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Microphone access is blocked. Allow microphone access for this site in your browser settings, then try again."
        : event.error === "audio-capture"
          ? "No microphone was found. Connect or enable a microphone, then try again."
          : event.error === "no-speech"
            ? "No speech was heard. Try again and speak near the microphone."
            : `Voice typing failed (${event.error}). You can type your notes instead.`;
    onError(message);
  };

  recognition.onend = () => {
    onEnd();
  };

  try {
    recognition.start();
  } catch (err) {
    console.warn("Failed to start speech recognition:", err);
    onError("Could not activate microphone. Check browser permissions.");
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    },
    isSupported: true,
  };
}

/**
 * Knowledge-based Agronomic AI Assistant answering live voice queries
 * in English, Luganda, Swahili, and Runyankole based on live farm telemetry.
 */
export function answerFarmerQuery(
  query: string,
  currentMoisture: number = 34,
  rainProb: number = 35,
  lang: SupportedLanguage = "en"
): { answerText: string; plainAdvice: string } {
  const q = query.toLowerCase();

  // Irrigation Query (English, Luganda, Swahili, Runyankole keywords)
  if (
    q.includes("irrigate") ||
    q.includes("water") ||
    q.includes("fukirira") ||
    q.includes("amazzi") ||
    q.includes("kumwagilia") ||
    q.includes("maji") ||
    q.includes("kwitirira")
  ) {
    if (currentMoisture < 28 && rainProb < 45) {
      if (lang === "lg") {
        return {
          answerText: `Ettaka lyo likaze, liri ku bitundu ${currentMoisture} ku buli kikumi. Enkuba ya maanyi tesuubirwa leero (${rainProb}%). Nfukirira leero olweggulo okukendeeza ku kwokya kw'omusana.`,
          plainAdvice: "Ffukirira olweggulo lwa leero.",
        };
      } else if (lang === "sw") {
        return {
          answerText: `Unyevu wa udongo uko chini (${currentMoisture}%). Hakuna mvua kubwa inayotarajiwa leo (${rainProb}%). Inashauriwa kumwagilia shamba jioni ya leo.`,
          plainAdvice: "Mwagilia shamba jioni ya leo.",
        };
      } else if (lang === "nyn") {
        return {
          answerText: `Eitaka ryawe ryomire, riri ahari ${currentMoisture}%. Enjura taine matsiko maingi leero (${rainProb}%). Itirira omu musiri gwawe akaire k'omumababa.`,
          plainAdvice: "Itirira omumababa ga leero.",
        };
      } else {
        return {
          answerText: `Soil moisture is low at ${currentMoisture}%, which is below target for your crops. Rain probability is only ${rainProb}%. Supplemental irrigation is advised in late afternoon.`,
          plainAdvice: "Apply light supplemental irrigation in late afternoon.",
        };
      }
    } else {
      if (lang === "lg") {
        return {
          answerText: `Amazzi mu ttaka gasaana (${currentMoisture}%), ate enkuba erina essuubi lya ${rainProb}%. Leka okufukirira leero otereke amazzi n'amafuta ga bbaampu.`,
          plainAdvice: "Leka okufukirira leero, enkuba esuubirwa.",
        };
      } else if (lang === "sw") {
        return {
          answerText: `Unyevu wa udongo bado ni mzuri (${currentMoisture}%) na kuna nafasi ya mvua ya ${rainProb}%. Huna haja ya kumwagilia leo.`,
          plainAdvice: "Usimwagilie leo, hifadhi maji.",
        };
      } else if (lang === "nyn") {
        return {
          answerText: `Ameezi omuitaka nihamwe (${currentMoisture}%), kandi enjura eine amatsiko (${rainProb}%). Otakwitirira leero, biika ameezi.`,
          plainAdvice: "Otakwitirira leero.",
        };
      } else {
        return {
          answerText: `Current soil moisture (${currentMoisture}%) is adequate, and rain forecast is ${rainProb}%. Hold irrigation for now to save water and pump fuel.`,
          plainAdvice: "Hold irrigation for now.",
        };
      }
    }
  }

  // Weather / Rain query
  if (
    q.includes("rain") ||
    q.includes("weather") ||
    q.includes("enkuba") ||
    q.includes("mvua") ||
    q.includes("enjura")
  ) {
    if (lang === "lg") {
      return {
        answerText: `Essuubi ly'enkuba leero liri ku bitundu ${rainProb} ku buli kikumi. Bw'oba olina okufuuyira, kola mu makya nga empewo tannasituka.`,
        plainAdvice: "Fuuyira mu makya nga empewo tekola nnyo.",
      };
    } else if (lang === "sw") {
      return {
        answerText: `Uwezekano wa mvua leo ni ${rainProb}%. Ikiwa unapanga kupulizia dawa, fanya hivyo asubuhi mapema kabla ya upepo kuongezeka.`,
        plainAdvice: "Pulizia asubuhi mapema.",
      };
    } else if (lang === "nyn") {
      return {
        answerText: `Amatsiko g'enjura leero gari ahari ${rainProb}%. Waaba nooyenda kufuuyira, kora aha kasheeshe kare omuyaga gutakatandikire.`,
        plainAdvice: "Fuuyira omu kasheeshe kare.",
      };
    } else {
      return {
        answerText: `Rain probability today is currently at ${rainProb}%. Wind speeds are calm, which makes the morning hours suitable for foliar spraying.`,
        plainAdvice: "Morning spraying window is favourable.",
      };
    }
  }

  // Coffee / Disease query
  if (
    q.includes("coffee") ||
    q.includes("rust") ||
    q.includes("emwanyi") ||
    q.includes("kahawa") ||
    q.includes("omwanyi")
  ) {
    if (lang === "lg") {
      return {
        answerText: `Okuziyiza obulwadde bw'olukuuku mu mwanyi (Coffee Leaf Rust), salako amatabi amakadde empewo eyiteemu bulungi, era ofuuyireko ekirungo kya kopa mu ntandikwa y'enkuba.`,
        plainAdvice: "Salira emwanyi ziweemu empewo.",
      };
    } else {
      return {
        answerText: `To manage Coffee Leaf Rust and twig borers, ensure proper canopy pruning for airflow, maintain 30% shade with albizia trees, and apply copper hydroxide preventatively before rains.`,
        plainAdvice: "Prune dense canopies to improve airflow.",
      };
    }
  }

  // General fallback
  if (lang === "lg") {
    return {
      answerText: `Ebyuma byo mu nnimiro biraga nti amazzi mu ttaka gali ku ${currentMoisture}%, essuubi ly'enkuba liri ${rainProb}%. Ennimiro yo eri bulungi.`,
      plainAdvice: "Ennimiro eri mu mbeera nnamu.",
    };
  } else if (lang === "sw") {
    return {
      answerText: `Sensorer za shamba zinaonyesha unyevu wa udongo ni ${currentMoisture}%, na uwezekano wa mvua ni ${rainProb}%. Hali ya shamba ni shwari.`,
      plainAdvice: "Hali ya shamba ni nzuri.",
    };
  } else if (lang === "nyn") {
    return {
      answerText: `Ebyuma by'omusiri nibyoreka ngu ameezi gari ahari ${currentMoisture}%, kandi enjura eine amatsiko ga ${rainProb}%. Omusiri guri gye.`,
      plainAdvice: "Omusiri guri omu mbeera nungi.",
    };
  } else {
    return {
      answerText: `Farm sensors report soil moisture at ${currentMoisture}% with a ${rainProb}% rain probability over the next 24 hours. Conditions are within stable ranges.`,
      plainAdvice: "Field conditions are currently stable.",
    };
  }
}
