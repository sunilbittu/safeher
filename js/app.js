/**
 * SafeHer Application - Main Initialization
 * Coordinates all modules and initializes the application
 */

class SafeHerApp {
  constructor() {
    this.initialized = false;
    this.modules = {
      db: dbManager,
      user: userManager,
      evidence: evidenceManager,
      sos: sosManager,
      location: locationManager,
      contacts: contactsManager,
      fakeCall: fakeCallManager,
      community: communityManager,
      preferences: preferencesManager,
      navigation: navigationManager,
      api: apiService
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      Utils.log.info('🚀 Starting SafeHer Application...');

      // Show splash screen
      this.showSplashScreen();

      // Initialize database
      Utils.log.info('Initializing database...');
      await this.modules.db.init();

      // Initialize default data
      await this.modules.db.initializeDefaultData();

      // Initialize API network listeners
      this.modules.api.initNetworkListeners();

      // Initialize navigation
      this.modules.navigation.init();

      // Check if user is logged in
      const currentUser = this.modules.user.getCurrentUser();

      if (currentUser) {
        Utils.log.success('User already logged in:', currentUser.name);

        // Load and apply preferences
        await this.modules.preferences.loadAndApplyPreferences();

        // Start location tracking if enabled
        const autoTrack = await this.modules.preferences.getPreference('share_location_auto');
        if (autoTrack) {
          // Optional: Start background location tracking
          // await this.modules.location.startTracking();
        }
      }

      // Setup event listeners
      this.setupEventListeners();

      // Setup gesture controls if enabled
      await this.setupGestureControls();

      this.initialized = true;
      Utils.log.success('✅ SafeHer Application initialized successfully');

      // Hide splash and show login/home screen
      setTimeout(() => {
        this.hideSplashScreen();
      }, CONFIG.UI.SPLASH_DURATION);

    } catch (error) {
      Utils.log.error('Initialization error:', error);
      Utils.showToast('Failed to initialize app. Please refresh.', 'error');
    }
  }

  /**
   * Show splash screen
   */
  showSplashScreen() {
    navigationManager.navigateTo(CONFIG.SCREENS.SPLASH, false);
  }

  /**
   * Hide splash screen and show appropriate screen
   */
  hideSplashScreen() {
    const currentUser = userManager.getCurrentUser();

    if (currentUser) {
      // User is logged in, go to home
      navigationManager.navigateTo(CONFIG.SCREENS.HOME);
    } else {
      // Show login screen
      navigationManager.navigateTo(CONFIG.SCREENS.LOGIN);
    }
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Handle visibility change (app going to background/foreground)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Utils.log.info('App went to background');
      } else {
        Utils.log.info('App came to foreground');
        // Could sync data here
      }
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      Utils.log.success('Internet connection restored');
    });

    window.addEventListener('offline', () => {
      Utils.log.warn('Internet connection lost');
    });

    // Prevent accidental page refresh
    window.addEventListener('beforeunload', (e) => {
      if (sosManager.currentAlert) {
        e.preventDefault();
        e.returnValue = 'You have an active SOS alert. Are you sure you want to leave?';
        return e.returnValue;
      }
    });

    Utils.log.info('Event listeners setup complete');
  }

  /**
   * Setup gesture controls
   */
  async setupGestureControls() {
    try {
      const gesturesEnabled = await preferencesManager.getPreference('invisible_gestures');

      if (!gesturesEnabled) {
        return;
      }

      // Shake detection
      if (window.DeviceMotionEvent) {
        let lastShake = 0;
        const shakeThreshold = 15;

        window.addEventListener('devicemotion', (event) => {
          const acceleration = event.accelerationIncludingGravity;
          const now = Date.now();

          if (now - lastShake < 1000) {
            return; // Debounce
          }

          const totalAcceleration = Math.abs(acceleration.x) +
                                   Math.abs(acceleration.y) +
                                   Math.abs(acceleration.z);

          if (totalAcceleration > shakeThreshold) {
            lastShake = now;
            Utils.log.info('Shake detected! Triggering SOS...');
            navigationManager.navigateTo(CONFIG.SCREENS.SOS);
          }
        });

        Utils.log.success('Shake gesture enabled');
      }

      // Volume button detection (limited in browser)
      // This would work better in a native app

      Utils.log.info('Gesture controls setup complete');

    } catch (error) {
      Utils.log.error('Gesture setup error:', error);
    }
  }

  /**
   * Get application status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      currentUser: userManager.getCurrentUser(),
      currentScreen: navigationManager.getCurrentScreen(),
      locationTracking: locationManager.tracking,
      dbReady: dbManager.db !== null
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    try {
      Utils.log.info('Shutting down application...');

      // Stop location tracking
      if (locationManager.tracking) {
        locationManager.stopTracking();
      }

      // Close database connection
      dbManager.close();

      // Clear any running timers
      if (sosManager.countdownInterval) {
        clearInterval(sosManager.countdownInterval);
      }

      Utils.log.success('Application shutdown complete');

    } catch (error) {
      Utils.log.error('Shutdown error:', error);
    }
  }
}

// Create global app instance
const app = new SafeHerApp();

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
} else {
  app.init();
}

// Expose app to window for debugging
if (CONFIG.DEBUG) {
  window.SafeHerApp = app;
  window.dbManager = dbManager;
  window.userManager = userManager;
  window.evidenceManager = evidenceManager;
  window.sosManager = sosManager;
  window.locationManager = locationManager;
  window.contactsManager = contactsManager;
  window.fakeCallManager = fakeCallManager;
  window.communityManager = communityManager;
  window.preferencesManager = preferencesManager;
  window.navigationManager = navigationManager;
  Utils.log.info('Debug mode: Managers exposed to window object');
}

// Global helper functions for HTML onclick handlers
function triggerFakeCall() {
  fakeCallManager.triggerCall();
}

function shareLocationAndSafeRoute() {
  locationManager.shareLocation();
}

function showCommunity() {
  communityManager.showCommunity();
}

// Handle login
async function handleLogin(phoneNumber) {
  if (!phoneNumber) {
    const input = document.querySelector('#login-screen input[type="tel"]');
    phoneNumber = input?.value;
  }

  if (!phoneNumber) {
    Utils.showToast('Please enter a phone number', 'warning');
    return;
  }

  Utils.showLoading('Logging in...');

  // Try to login
  let result = await userManager.login(phoneNumber);

  // If user doesn't exist, register
  if (!result.success && result.error.includes('not found')) {
    result = await userManager.register({ phone_number: phoneNumber });
  }

  Utils.hideLoading();

  if (result.success) {
    navigationManager.navigateTo(CONFIG.SCREENS.HOME);
  }
}

// Handle guest login
async function continueAsGuest() {
  Utils.showLoading('Setting up guest account...');
  const result = await userManager.continueAsGuest();
  Utils.hideLoading();

  if (result.success) {
    navigationManager.navigateTo(CONFIG.SCREENS.HOME);
  }
}

Utils.log.success('app.js loaded');
