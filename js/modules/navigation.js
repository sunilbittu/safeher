/**
 * Navigation Module - Handles screen navigation and routing
 */

class NavigationManager {
  constructor() {
    this.currentScreen = null;
    this.navigationHistory = [];
    this.mainContent = null;
    this.bottomNav = null;
    this.navButtons = {};
  }

  /**
   * Initialize navigation
   */
  init() {
    this.mainContent = document.getElementById('main-content');
    this.bottomNav = document.getElementById('bottom-nav');

    this.navButtons = {
      [CONFIG.SCREENS.HOME]: document.getElementById('nav-home'),
      [CONFIG.SCREENS.EVIDENCE]: document.getElementById('nav-evidence'),
      [CONFIG.SCREENS.SETTINGS]: document.getElementById('nav-settings')
    };

    // Setup back button handling
    this.setupBackButtonHandling();

    Utils.log.success('Navigation initialized');
  }

  /**
   * Navigate to a screen
   */
  async navigateTo(screenId, addToHistory = true) {
    try {
      if (!this.mainContent) {
        this.init();
      }

      // Stop SOS timer if navigating away from SOS screen
      if (screenId !== CONFIG.SCREENS.SOS && sosManager.countdownInterval) {
        clearInterval(sosManager.countdownInterval);
        sosManager.countdownInterval = null;
      }

      // Hide all screens
      const screens = this.mainContent.children;
      for (let screen of screens) {
        screen.classList.add('hidden');
      }

      // Show target screen
      const targetScreen = document.getElementById(screenId);
      if (targetScreen) {
        targetScreen.classList.remove('hidden');

        // Add to history
        if (addToHistory) {
          this.navigationHistory.push(screenId);
        }

        this.currentScreen = screenId;

        // Handle bottom navigation
        this.updateBottomNav(screenId);

        // Handle screen-specific logic
        await this.handleScreenEntry(screenId);

        Utils.log.info('Navigated to:', screenId);
      } else {
        Utils.log.error('Screen not found:', screenId);
      }

    } catch (error) {
      Utils.log.error('Navigation error:', error);
    }
  }

  /**
   * Handle screen entry logic
   */
  async handleScreenEntry(screenId) {
    switch (screenId) {
      case CONFIG.SCREENS.HOME:
        // Refresh dashboard data if needed
        break;

      case CONFIG.SCREENS.EVIDENCE:
        // Render evidence grid
        await evidenceManager.renderEvidenceGrid();
        break;

      case CONFIG.SCREENS.SETTINGS:
        // Render contacts list
        await contactsManager.renderContactsList();
        break;

      case CONFIG.SCREENS.SOS:
        // Start SOS countdown
        this.startSOSCountdown();
        break;

      default:
        break;
    }
  }

  /**
   * Update bottom navigation state
   */
  updateBottomNav(screenId) {
    if (!this.bottomNav) return;

    // Show/hide bottom nav based on screen
    if (CONFIG.SCREENS_WITH_NAV.includes(screenId)) {
      this.bottomNav.classList.remove('hidden');

      // Update active button
      Object.values(this.navButtons).forEach(button => {
        if (button) {
          button.classList.replace('text-purple-400', 'text-gray-500');
        }
      });

      const activeButton = this.navButtons[screenId];
      if (activeButton) {
        activeButton.classList.replace('text-gray-500', 'text-purple-400');
      }
    } else {
      this.bottomNav.classList.add('hidden');
    }
  }

  /**
   * Start SOS countdown
   */
  startSOSCountdown() {
    const sosContent = document.getElementById('sos-content');
    const sosMessage = document.getElementById('sos-message');
    const cancelBtn = document.getElementById('cancel-sos-button');

    if (!sosContent || !sosMessage || !cancelBtn) {
      return;
    }

    // Show cancel button
    cancelBtn.style.display = 'block';

    // Start countdown
    sosManager.startCountdown(
      // onComplete
      async (result) => {
        if (result.success) {
          sosContent.innerHTML = `
            <div class="flex flex-col items-center">
              <svg class="w-24 h-24 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h1 class="text-4xl font-bold mt-4">SOS Activated</h1>
            </div>
          `;
          sosMessage.textContent = CONFIG.SUCCESS.SOS_TRIGGERED;
          cancelBtn.style.display = 'none';
        } else {
          sosMessage.textContent = 'Error activating SOS. Please try again.';
        }
      },
      // onTick
      (count) => {
        sosContent.innerHTML = `<span class="text-8xl font-bold">${count}</span>`;
        sosMessage.textContent = 'Activating alert...';
      },
      // onCancel (handled by button)
      null
    );
  }

  /**
   * Go back to previous screen
   */
  goBack() {
    if (this.navigationHistory.length > 1) {
      // Remove current screen
      this.navigationHistory.pop();

      // Get previous screen
      const previousScreen = this.navigationHistory[this.navigationHistory.length - 1];

      // Navigate without adding to history
      this.navigateTo(previousScreen, false);
    } else {
      // Default to home screen
      this.navigateTo(CONFIG.SCREENS.HOME);
    }
  }

  /**
   * Setup back button handling
   */
  setupBackButtonHandling() {
    // Handle browser back button
    window.addEventListener('popstate', (event) => {
      this.goBack();
    });

    // Handle Android back button (if running as PWA)
    document.addEventListener('backbutton', (event) => {
      event.preventDefault();
      this.goBack();
    });
  }

  /**
   * Get current screen
   */
  getCurrentScreen() {
    return this.currentScreen;
  }

  /**
   * Clear navigation history
   */
  clearHistory() {
    this.navigationHistory = [];
  }
}

// Create singleton instance
const navigationManager = new NavigationManager();

// Global navigation function (called from HTML)
function navigateTo(screenId) {
  navigationManager.navigateTo(screenId);
}
