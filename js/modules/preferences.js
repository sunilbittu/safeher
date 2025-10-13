/**
 * Preferences Module - Manages user preferences
 */

class PreferencesManager {
  constructor() {
    this.preferences = null;
  }

  /**
   * Create default preferences for new user
   */
  async createDefaultPreferences(userId) {
    try {
      const defaultPrefs = {
        user_id: userId,
        invisible_gestures: true,
        theme: CONFIG.THEMES.DARK,
        language: 'en',
        fake_call_contact_name: CONFIG.FAKE_CALL.DEFAULT_CALLER,
        fake_call_language: CONFIG.FAKE_CALL.DEFAULT_LANGUAGE,
        auto_record_sos: true,
        share_location_auto: true
      };

      const id = await dbManager.add('user_preferences', defaultPrefs);
      defaultPrefs.id = id;

      this.preferences = defaultPrefs;

      Utils.log.success('Default preferences created:', id);

      return { success: true, preferences: defaultPrefs };
    } catch (error) {
      Utils.log.error('Create preferences error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences() {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        return null;
      }

      // Check if already loaded
      if (this.preferences && this.preferences.user_id === user.id) {
        return this.preferences;
      }

      // Load from database
      const prefs = await dbManager.getByIndex('user_preferences', 'user_id', user.id);

      if (prefs.length > 0) {
        this.preferences = prefs[0];
        return this.preferences;
      }

      // Create default if not exists
      const result = await this.createDefaultPreferences(user.id);
      return result.preferences;

    } catch (error) {
      Utils.log.error('Get preferences error:', error);
      return null;
    }
  }

  /**
   * Update preferences
   */
  async updatePreferences(updates) {
    try {
      const currentPrefs = await this.getPreferences();

      if (!currentPrefs) {
        throw new Error('Preferences not found');
      }

      const updatedPrefs = { ...currentPrefs, ...updates };
      await dbManager.update('user_preferences', updatedPrefs);

      this.preferences = updatedPrefs;

      Utils.log.success('Preferences updated');
      Utils.showToast(CONFIG.SUCCESS.PREFERENCES_SAVED, 'success');

      // Apply theme if changed
      if (updates.theme) {
        this.applyTheme(updates.theme);
      }

      return { success: true, preferences: updatedPrefs };
    } catch (error) {
      Utils.log.error('Update preferences error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get specific preference
   */
  async getPreference(key) {
    const prefs = await this.getPreferences();
    return prefs ? prefs[key] : null;
  }

  /**
   * Set specific preference
   */
  async setPreference(key, value) {
    return this.updatePreferences({ [key]: value });
  }

  /**
   * Apply theme to the UI
   */
  applyTheme(theme) {
    const body = document.body;

    if (theme === CONFIG.THEMES.LIGHT) {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
      Utils.log.info('Light theme applied');
    } else {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
      Utils.log.info('Dark theme applied');
    }
  }

  /**
   * Toggle theme
   */
  async toggleTheme() {
    const currentTheme = await this.getPreference('theme');
    const newTheme = currentTheme === CONFIG.THEMES.DARK ? CONFIG.THEMES.LIGHT : CONFIG.THEMES.DARK;

    return this.updatePreferences({ theme: newTheme });
  }

  /**
   * Toggle invisible gestures
   */
  async toggleInvisibleGestures() {
    const current = await this.getPreference('invisible_gestures');
    return this.updatePreferences({ invisible_gestures: !current });
  }

  /**
   * Load and apply preferences on app start
   */
  async loadAndApplyPreferences() {
    try {
      const prefs = await this.getPreferences();

      if (!prefs) {
        return;
      }

      // Apply theme
      this.applyTheme(prefs.theme);

      // Apply language if needed
      if (prefs.language && prefs.language !== 'en') {
        // Language switching logic would go here
        Utils.log.info('Language preference:', prefs.language);
      }

      Utils.log.success('Preferences loaded and applied');

      return prefs;
    } catch (error) {
      Utils.log.error('Load preferences error:', error);
      return null;
    }
  }

  /**
   * Reset preferences to default
   */
  async resetPreferences() {
    try {
      const confirmed = await Utils.confirm(
        'Are you sure you want to reset all preferences to default?',
        'Reset Preferences'
      );

      if (!confirmed) {
        return { success: false, cancelled: true };
      }

      const user = userManager.getCurrentUser();
      if (!user) {
        throw new Error('User not logged in');
      }

      // Delete existing preferences
      if (this.preferences) {
        await dbManager.delete('user_preferences', this.preferences.id);
      }

      // Create new default preferences
      const result = await this.createDefaultPreferences(user.id);

      if (result.success) {
        await this.loadAndApplyPreferences();
        Utils.showToast('Preferences reset to default', 'success');
      }

      return result;
    } catch (error) {
      Utils.log.error('Reset preferences error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Export preferences as JSON
   */
  async exportPreferences() {
    try {
      const prefs = await this.getPreferences();
      if (!prefs) {
        throw new Error('No preferences to export');
      }

      const json = JSON.stringify(prefs, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `safeher-preferences-${new Date().getTime()}.json`;
      link.click();

      URL.revokeObjectURL(url);

      Utils.showToast('Preferences exported', 'success');

      return { success: true };
    } catch (error) {
      Utils.log.error('Export preferences error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const preferencesManager = new PreferencesManager();
