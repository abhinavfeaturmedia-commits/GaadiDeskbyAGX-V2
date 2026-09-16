/**
 * Voice-to-Booking Speech Recognition Engine for GaadiDesk
 * Tailored for Indian fleet operators with multi-lingual support:
 * Hindi (hi-IN), Marathi (mr-IN), and Indian English (en-IN).
 * Extracts customer name, pickup/drop route, vehicle category, dates, and advance payment.
 */

export const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export class VoiceBookingAssistant {
  constructor(options = {}) {
    this.lang = options.lang || 'hi-IN'; // 'hi-IN' | 'mr-IN' | 'en-IN'
    this.recognition = null;
    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onEndCallback = null;

    this.init();
  }

  init() {
    if (!isSpeechRecognitionSupported()) return;

    try {
      const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang;

      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = (finalTranscript || interimTranscript).trim();
        if (this.onResultCallback && text) {
          this.onResultCallback({
            text,
            isFinal: Boolean(finalTranscript),
            parsed: parseSpokenTripText(text)
          });
        }
      };

      this.recognition.onerror = (err) => {
        this.isListening = false;
        if (this.onErrorCallback) {
          this.onErrorCallback(err);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };
    } catch (err) {
      console.warn('[VoiceBooking] Speech recognition initialization failed:', err);
      this.recognition = null;
    }
  }

  setLanguage(lang) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  start(onResult, onError, onEnd) {
    if (!this.recognition) return false;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      console.warn('[VoiceBooking] SpeechRecognition start error:', err);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.isListening = false;
  }
}

/**
 * Natural language intent parser for Indian fleet bookings
 * Parses spoken phrases like:
 * "Ramesh Patil, Pune to Shirdi, tomorrow morning 6 AM, Ertiga, 2000 advance"
 * "सुरेश जाधव कोल्हापूर ते मुंबई इनोव्हा 1500 ऍडव्हान्स"
 * @param {string} text - Raw speech string
 * @returns {Object} Extracted booking fields
 */
export function parseSpokenTripText(text = '') {
  if (!text) return {};

  const clean = text.trim();
  const lower = clean.toLowerCase();

  const extracted = {
    rawText: clean,
    tripType: 'Outstation',
    customerName: '',
    pickupLocation: '',
    dropLocation: '',
    carCategory: '',
    date: '',
    time: '',
    advancePaid: ''
  };

  // 1. Detect Trip Type
  if (/airport|vimantal|विमानतळ|हवाई/i.test(clean)) {
    extracted.tripType = 'Airport';
  } else if (/local|city|8\s*ghante|8\s*hr|80\s*km|लोकल/i.test(clean)) {
    extracted.tripType = 'Local';
  } else if (/rental|self\s*drive|रेंटल/i.test(clean)) {
    extracted.tripType = 'Rental';
  } else if (/outstation|intercity|बाहेरगाव/i.test(clean)) {
    extracted.tripType = 'Outstation';
  }

  // 2. Detect Route / Locations ("Pune to Mumbai", "Pune se Shirdi", "Pune te Mahabaleshwar")
  const routeRegex = /([a-zA-Z\u0900-\u097F\s]+)\s+(?:to|se|te|ते|से)\s+([a-zA-Z\u0900-\u097F\s]+)/i;
  const routeMatch = clean.match(routeRegex);
  if (routeMatch) {
    let p = routeMatch[1].trim();
    let d = routeMatch[2].trim();

    // Clean customer name if it precedes pickup e.g. "Ramesh Patil Pune to Shirdi"
    const nameMatch = p.match(/^([a-zA-Z\u0900-\u097F\s]+?)\s+(pune|mumbai|kolhapur|sangli|satara|nashik|shirdi|goa|nagpur|solapur|aurangabad|pune airport)/i);
    if (nameMatch) {
      extracted.customerName = nameMatch[1].trim();
      p = p.replace(nameMatch[1], '').trim();
    }

    // Clean any trailing words from drop location
    d = d.split(/\s+(?:tomorrow|kal|aaj|today|ertiga|innova|sedan|suv|advance|morning|evening|सकाळी|उद्या|दुपारी)/i)[0].trim();

    extracted.pickupLocation = p;
    extracted.dropLocation = d;
  }

  // 3. Detect Vehicle Category / Model
  if (/innova|crysta|इन्व्हा/i.test(clean)) {
    extracted.carCategory = 'Innova';
  } else if (/ertiga|ertiga|अर्टिगा/i.test(clean)) {
    extracted.carCategory = 'SUV';
  } else if (/dzire|etios|sedan|डिझायर|सेडान/i.test(clean)) {
    extracted.carCategory = 'Sedan';
  } else if (/suv|scorpio|xuv/i.test(clean)) {
    extracted.carCategory = 'SUV';
  } else if (/wagonr|i10|swift|hatchback/i.test(clean)) {
    extracted.carCategory = 'Hatchback';
  }

  // 4. Detect Date (Today, Tomorrow, Kal, Aaj, Udya)
  const today = new Date();
  if (/kal|tomorrow|उद्या|कल/i.test(clean)) {
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    extracted.date = tomorrow.toISOString().split('T')[0];
  } else if (/aaj|today|आज/i.test(clean)) {
    extracted.date = today.toISOString().split('T')[0];
  }

  // 5. Detect Advance / Fare Payment
  const advanceMatch = clean.match(/(\d{3,6})\s*(?:advance|adv|rupaye|advance|deposit|रुपये|ऍडव्हान्स)/i) ||
                       clean.match(/(?:advance|adv|ऍडव्हान्स)\s*(\d{3,6})/i);
  if (advanceMatch) {
    extracted.advancePaid = advanceMatch[1];
  }

  // 6. Fallback Customer Name extraction if not caught by route
  if (!extracted.customerName) {
    const commaSplit = clean.split(/[,:]/);
    if (commaSplit.length > 1 && commaSplit[0].trim().split(' ').length <= 3) {
      extracted.customerName = commaSplit[0].trim();
    }
  }

  return extracted;
}
