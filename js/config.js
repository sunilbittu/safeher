/**
 * Configuration file for SafeHer application
 * Contains all app-wide constants and settings
 */

const CONFIG = {
  // App Information
  APP_NAME: 'SafeHer',
  APP_VERSION: '1.0.0',

  // Database
  DB_NAME: 'SafeHerDB',
  DB_VERSION: 1,

  // API Endpoints
  API_BASE_URL: 'https://jsonplaceholder.typicode.com',
  API_ENDPOINTS: {
    CATCH: '/posts',
    COMMUNITY: '/users'
  },

  // Screen Names
  SCREENS: {
    SPLASH: 'splash-screen',
    LOGIN: 'login-screen',
    HOME: 'home-screen',
    SOS: 'sos-screen',
    EVIDENCE: 'evidence-screen',
    SETTINGS: 'settings-screen'
  },

  // Navigation
  SCREENS_WITH_NAV: ['home-screen', 'evidence-screen', 'settings-screen'],

  // SOS Settings
  SOS: {
    COUNTDOWN_SECONDS: 3,
    AUTO_ALERT_CONTACTS: true,
    AUTO_RECORD: true
  },

  // Location Settings
  LOCATION: {
    HIGH_ACCURACY: true,
    TIMEOUT: 10000, // 10 seconds
    MAX_AGE: 0,
    TRACKING_INTERVAL: 30000, // 30 seconds
    SAFE_ZONE_RADIUS: 100 // meters
  },

  // Evidence Settings
  EVIDENCE: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
    SUPPORTED_AUDIO_TYPES: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'],
    AUTO_ENCRYPT: true
  },

  // Fake Call Settings
  FAKE_CALL: {
    DEFAULT_CALLER: 'Mom',
    DEFAULT_LANGUAGE: 'en',
    RINGTONE_URL: 'https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg',
    SUPPORTED_LANGUAGES: ['en', 'hi', 'te']
  },

  // UI Settings
  UI: {
    SPLASH_DURATION: 3000, // 3 seconds
    TOAST_DURATION: 3000,
    ANIMATION_DURATION: 300
  },

  // Theme Settings
  THEMES: {
    DARK: 'dark',
    LIGHT: 'light'
  },

  // Local Storage Keys
  STORAGE_KEYS: {
    CURRENT_USER: 'safeher_current_user',
    SESSION: 'safeher_session',
    PREFERENCES: 'safeher_preferences',
    OFFLINE_QUEUE: 'safeher_offline_queue'
  },

  // Emergency Contact Types
  CONTACT_TYPES: {
    PERSONAL: 'personal',
    POLICE: 'police',
    SHE_TEAM: 'she_team',
    VOLUNTEER: 'volunteer',
    TRANSGENDER: 'transgender'
  },

  // Evidence Types
  EVIDENCE_TYPES: {
    PHOTO: 'photo',
    VIDEO: 'video',
    AUDIO: 'audio',
    CHAT_LOG: 'chat_log',
    DOCUMENT: 'document'
  },

  // SOS Status
  SOS_STATUS: {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    RESOLVED: 'resolved'
  },

  // Risk Levels
  RISK_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  },

  // Error Messages
  ERRORS: {
    DB_INIT_FAILED: 'Failed to initialize database',
    USER_NOT_FOUND: 'User not found',
    INVALID_CREDENTIALS: 'Invalid credentials',
    LOCATION_DENIED: 'Location permission denied',
    FILE_TOO_LARGE: 'File size exceeds maximum limit',
    UNSUPPORTED_FILE: 'Unsupported file type',
    NETWORK_ERROR: 'Network error occurred',
    GENERIC_ERROR: 'An error occurred. Please try again.'
  },

  // Success Messages
  SUCCESS: {
    USER_CREATED: 'User created successfully',
    EVIDENCE_ADDED: 'Evidence added to vault',
    SOS_TRIGGERED: 'SOS alert sent successfully',
    CONTACT_ADDED: 'Contact added successfully',
    PREFERENCES_SAVED: 'Preferences saved',
    LOCATION_SHARED: 'Location shared with emergency contacts'
  },

  // Fake Call Scripts
  FAKE_CALL_SCRIPTS: {
    en: [
      "Hey, where are you?",
      "Are you fine?",
      "I'm waiting for you here.",
      "How much time will it take?",
      "Come quickly",
      "Share me your location."
    ],
    hi: [
      "अरे, तुम कहाँ हो?",
      "क्या तुम ठीक हो?",
      "मैं यहाँ तुम्हारा इंतज़ार कर रही हूँ।",
      "कितना समय लगेगा?",
      "कृपया जल्दी आओ।"
    ],
    te: [
      "Hello Ekkada unnav?",
      "Baagaane Unnava?",
      "Nenu ikkada nikosam wait chesthunnanu.",
      "Entha time pattidhi?",
      "thwaaragaa raa",
      "Location Share chey Naaku."
    ]
  },

  // Development Mode
  DEBUG: true,
  LOG_LEVEL: 'info' // 'info', 'warn', 'error'
};

// Freeze the config object to prevent modifications
Object.freeze(CONFIG);
