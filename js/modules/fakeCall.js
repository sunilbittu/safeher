/**
 * Fake Call Module - Manages fake call feature
 */

class FakeCallManager {
  constructor() {
    this.ringtone = null;
    this.speakingFlag = false;
    this.overlay = null;
  }

  /**
   * Trigger fake call
   */
  async triggerCall(template = null) {
    try {
      const user = userManager.getCurrentUser();

      // Get preferences
      const prefs = await preferencesManager.getPreferences();
      const callerName = template?.caller_name || prefs?.fake_call_contact_name || CONFIG.FAKE_CALL.DEFAULT_CALLER;
      const language = template?.language || prefs?.fake_call_language || CONFIG.FAKE_CALL.DEFAULT_LANGUAGE;

      // Play ringtone
      this.ringtone = new Audio(CONFIG.FAKE_CALL.RINGTONE_URL);
      this.ringtone.loop = true;
      this.ringtone.play().catch(e => Utils.log.warn("Autoplay blocked:", e));

      // Create overlay
      this.overlay = document.createElement("div");
      this.overlay.className = "fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 text-white transition-all duration-300";

      this.overlay.innerHTML = `
        <div class="text-center animate-fadeIn max-w-sm p-6 rounded-lg">
          <img src="https://cdn-icons-png.flaticon.com/512/194/194938.png" alt="Caller"
               class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-green-500 shadow-lg">
          <h2 class="text-2xl font-semibold mb-1">${Utils.sanitize(callerName)} Calling...</h2>
          <p class="text-sm mb-3 opacity-80">Incoming call</p>
          <div class="flex justify-center gap-4 mb-4">
            <button id="acceptCall" class="bg-green-500 hover:bg-green-600 rounded-full p-4 shadow-lg">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
              </svg>
            </button>
            <button id="declineCall" class="bg-red-500 hover:bg-red-600 rounded-full p-4 shadow-lg">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
              </svg>
            </button>
          </div>
          <div class="flex items-center justify-center gap-3 mb-3">
            <label class="text-sm opacity-80">Language:</label>
            <select id="callLang" class="bg-gray-800 text-white rounded px-2 py-1 text-sm">
              <option value="en" ${language === 'en' ? 'selected' : ''}>English</option>
              <option value="hi" ${language === 'hi' ? 'selected' : ''}>Hindi</option>
              <option value="te" ${language === 'te' ? 'selected' : ''}>Telugu</option>
            </select>
          </div>
        </div>
      `;
      document.body.appendChild(this.overlay);

      // Setup event handlers
      this.setupCallHandlers(language);

      Utils.log.info('Fake call triggered');

      return { success: true };
    } catch (error) {
      Utils.log.error('Trigger fake call error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup call event handlers
   */
  setupCallHandlers(initialLanguage) {
    const closeOverlay = () => {
      if (this.overlay) {
        this.overlay.classList.add("opacity-0");
        setTimeout(() => {
          if (this.overlay) this.overlay.remove();
          this.overlay = null;
        }, 300);
      }
    };

    // Decline button
    document.getElementById("declineCall").onclick = () => {
      if (this.ringtone) {
        this.ringtone.pause();
        this.ringtone = null;
      }
      this.stopSpeech();
      closeOverlay();
    };

    // Accept button
    document.getElementById("acceptCall").onclick = async () => {
      if (this.ringtone) {
        this.ringtone.pause();
        this.ringtone = null;
      }
      this.stopSpeech();

      const langSelect = document.getElementById("callLang");
      await this.startConversation(langSelect.value);

      // Add end call button
      const endBtn = document.createElement("button");
      endBtn.textContent = "End Call";
      endBtn.className = "bg-red-500 hover:bg-red-600 rounded-full px-6 py-3 shadow-lg mt-4";
      endBtn.onclick = () => {
        this.speakingFlag = false;
        this.stopSpeech();
        closeOverlay();
      };
      this.overlay.appendChild(endBtn);
    };

    // Language change
    const langSelect = document.getElementById("callLang");
    langSelect.onchange = () => {
      this.speakingFlag = false;
      this.stopSpeech();
      setTimeout(() => {
        this.speakingFlag = true;
        this.startConversation(langSelect.value);
      }, 200);
    };
  }

  /**
   * Start fake conversation
   */
  async startConversation(language) {
    this.speakingFlag = true;

    const scripts = CONFIG.FAKE_CALL_SCRIPTS;
    const lines = scripts[language] || scripts.en;

    await this.ensureVoicesLoaded();

    for (let i = 0; i < lines.length; i++) {
      if (!this.speakingFlag) break;

      await this.speakLine(lines[i], language);
      await this.pause(1000); // 1 second between lines
    }
  }

  /**
   * Speak a single line
   */
  async speakLine(text, language) {
    return new Promise(resolve => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.chooseVoiceByLang(language);

      if (voice) utterance.voice = voice;
      utterance.lang = this.getLangCode(language);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = resolve;
      utterance.onerror = resolve;

      speechSynthesis.speak(utterance);
    });
  }

  /**
   * Choose voice by language
   */
  chooseVoiceByLang(lang) {
    const voices = speechSynthesis.getVoices();
    const langCode = this.getLangCode(lang);

    // Try exact match
    let voice = voices.find(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase()));
    if (voice) return voice;

    // Try partial match
    voice = voices.find(v => v.lang.toLowerCase().includes(lang.toLowerCase()));
    if (voice) return voice;

    // Default to English
    voice = voices.find(v => v.lang.toLowerCase().startsWith("en"));
    return voice || voices[0] || null;
  }

  /**
   * Get language code
   */
  getLangCode(lang) {
    const codes = {
      en: 'en-US',
      hi: 'hi-IN',
      te: 'te-IN'
    };
    return codes[lang] || 'en-US';
  }

  /**
   * Ensure voices are loaded
   */
  ensureVoicesLoaded() {
    return new Promise(resolve => {
      let voices = speechSynthesis.getVoices();
      if (voices.length) return resolve();

      speechSynthesis.onvoiceschanged = () => resolve();
      setTimeout(resolve, 500);
    });
  }

  /**
   * Stop speech
   */
  stopSpeech() {
    this.speakingFlag = false;
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  }

  /**
   * Pause utility
   */
  pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Save fake call template
   */
  async saveTemplate(templateData) {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        throw new Error('User not logged in');
      }

      const template = {
        user_id: user.id,
        caller_name: templateData.caller_name,
        caller_image_url: templateData.caller_image_url || null,
        language: templateData.language || 'en',
        is_default: templateData.is_default || false,
        created_at: new Date().toISOString()
      };

      const id = await dbManager.add('fake_call_templates', template);
      template.id = id;

      Utils.log.success('Fake call template saved:', id);
      Utils.showToast('Template saved successfully', 'success');

      return { success: true, template };
    } catch (error) {
      Utils.log.error('Save template error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get saved templates
   */
  async getTemplates() {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        return [];
      }

      const templates = await dbManager.getByIndex('fake_call_templates', 'user_id', user.id);
      return templates;
    } catch (error) {
      Utils.log.error('Get templates error:', error);
      return [];
    }
  }
}

// Create singleton instance
const fakeCallManager = new FakeCallManager();
