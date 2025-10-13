/**
 * User Module - Handles user authentication and profile management
 */

class UserManager {
  constructor() {
    this.currentUser = null;
    this.loadCurrentUser();
  }

  /**
   * Load current user from localStorage
   */
  loadCurrentUser() {
    this.currentUser = Utils.storage.get(CONFIG.STORAGE_KEYS.CURRENT_USER);
    return this.currentUser;
  }

  /**
   * Save current user to localStorage
   */
  saveCurrentUser(user) {
    this.currentUser = user;
    Utils.storage.set(CONFIG.STORAGE_KEYS.CURRENT_USER, user);
  }

  /**
   * Create a new user account
   */
  async register(userData) {
    try {
      const { phone_number, name, email } = userData;

      // Validate input
      if (!phone_number) {
        throw new Error('Phone number is required');
      }

      if (phone_number && !Utils.isValidPhone(phone_number)) {
        throw new Error('Invalid phone number');
      }

      if (email && !Utils.isValidEmail(email)) {
        throw new Error('Invalid email address');
      }

      // Check if user already exists
      const existingUsers = await dbManager.getByIndex('users', 'phone_number', phone_number);
      if (existingUsers.length > 0) {
        throw new Error('User with this phone number already exists');
      }

      // Create user
      const user = {
        phone_number,
        name: name || 'Guest User',
        email: email || null,
        is_guest: false,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      const userId = await dbManager.add('users', user);
      user.id = userId;

      // Create default preferences
      await preferencesManager.createDefaultPreferences(userId);

      // Save as current user
      this.saveCurrentUser(user);

      Utils.log.success('User registered:', user);
      Utils.showToast(CONFIG.SUCCESS.USER_CREATED, 'success');

      return { success: true, user };
    } catch (error) {
      Utils.log.error('Registration error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Login with phone number (OTP would be validated here in production)
   */
  async login(phone_number) {
    try {
      if (!phone_number || !Utils.isValidPhone(phone_number)) {
        throw new Error('Invalid phone number');
      }

      // Find user
      const users = await dbManager.getByIndex('users', 'phone_number', phone_number);

      if (users.length === 0) {
        throw new Error('User not found. Please register first.');
      }

      const user = users[0];

      // Update last login
      user.last_login = new Date().toISOString();
      await dbManager.update('users', user);

      // Save as current user
      this.saveCurrentUser(user);

      Utils.log.success('User logged in:', user);
      Utils.showToast('Login successful!', 'success');

      return { success: true, user };
    } catch (error) {
      Utils.log.error('Login error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Continue as guest (creates temporary user)
   */
  async continueAsGuest() {
    try {
      const guestUser = {
        phone_number: null,
        name: 'Guest User',
        email: null,
        is_guest: true,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      const userId = await dbManager.add('users', guestUser);
      guestUser.id = userId;

      // Create default preferences
      await preferencesManager.createDefaultPreferences(userId);

      // Save as current user
      this.saveCurrentUser(guestUser);

      Utils.log.info('Guest user created:', guestUser);
      Utils.showToast('Continuing as guest', 'info');

      return { success: true, user: guestUser };
    } catch (error) {
      Utils.log.error('Guest mode error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout current user
   */
  logout() {
    this.currentUser = null;
    Utils.storage.remove(CONFIG.STORAGE_KEYS.CURRENT_USER);
    Utils.showToast('Logged out successfully', 'info');
    Utils.log.info('User logged out');
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return this.currentUser !== null;
  }

  /**
   * Check if current user is guest
   */
  isGuest() {
    return this.currentUser?.is_guest === true;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      // Validate updates
      if (updates.phone_number && !Utils.isValidPhone(updates.phone_number)) {
        throw new Error('Invalid phone number');
      }

      if (updates.email && !Utils.isValidEmail(updates.email)) {
        throw new Error('Invalid email address');
      }

      // Update user
      const updatedUser = { ...this.currentUser, ...updates };
      await dbManager.update('users', updatedUser);

      // Update current user
      this.saveCurrentUser(updatedUser);

      Utils.log.success('Profile updated:', updatedUser);
      Utils.showToast('Profile updated successfully', 'success');

      return { success: true, user: updatedUser };
    } catch (error) {
      Utils.log.error('Profile update error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount() {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      const confirmed = await Utils.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.',
        'Delete Account'
      );

      if (!confirmed) {
        return { success: false, cancelled: true };
      }

      const userId = this.currentUser.id;

      // Delete user (cascade will delete related data)
      await dbManager.delete('users', userId);

      // Logout
      this.logout();

      Utils.showToast('Account deleted successfully', 'success');

      return { success: true };
    } catch (error) {
      Utils.log.error('Account deletion error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      if (!this.currentUser) {
        return null;
      }

      const userId = this.currentUser.id;

      const [
        evidenceCount,
        sosAlertsCount,
        contactsCount,
        locationCount
      ] = await Promise.all([
        dbManager.getByIndex('evidence', 'user_id', userId).then(items => items.length),
        dbManager.getByIndex('sos_alerts', 'user_id', userId).then(items => items.length),
        dbManager.getByIndex('emergency_contacts', 'user_id', userId).then(items => items.length),
        dbManager.getByIndex('location_history', 'user_id', userId).then(items => items.length)
      ]);

      return {
        evidenceCount,
        sosAlertsCount,
        contactsCount,
        locationCount
      };
    } catch (error) {
      Utils.log.error('Error getting user stats:', error);
      return null;
    }
  }
}

// Create singleton instance
const userManager = new UserManager();
