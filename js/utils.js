/**
 * Utility functions for SafeHer application
 * Common helper functions used across the application
 */

const Utils = {
  /**
   * Format date to readable string
   */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  },

  /**
   * Format date with time
   */
  formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Get time ago string (e.g., "2 hours ago")
   */
  timeAgo(date) {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }

    return 'Just now';
  },

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Validate phone number
   */
  isValidPhone(phone) {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Sanitize string (prevent XSS)
   */
  sanitize(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 3000) {
    // Remove existing toast if any
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
      existingToast.remove();
    }

    const colors = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      warning: 'bg-yellow-600',
      info: 'bg-purple-600'
    };

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Show loading spinner
   */
  showLoading(message = 'Loading...') {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50';
    loadingDiv.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 text-white text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(loadingDiv);
  },

  /**
   * Hide loading spinner
   */
  hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
      loading.remove();
    }
  },

  /**
   * Show confirmation dialog
   */
  async confirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-sm mx-4 text-white">
          <h3 class="text-xl font-bold mb-4">${title}</h3>
          <p class="mb-6">${message}</p>
          <div class="flex gap-3 justify-end">
            <button id="cancel-btn" class="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">Cancel</button>
            <button id="confirm-btn" class="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('confirm-btn').onclick = () => {
        modal.remove();
        resolve(true);
      };

      document.getElementById('cancel-btn').onclick = () => {
        modal.remove();
        resolve(false);
      };
    });
  },

  /**
   * Get current location
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: CONFIG.LOCATION.HIGH_ACCURACY,
          timeout: CONFIG.LOCATION.TIMEOUT,
          maximumAge: CONFIG.LOCATION.MAX_AGE
        }
      );
    });
  },

  /**
   * Calculate distance between two coordinates (in meters)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  },

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Local Storage helpers
   */
  storage: {
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
      }
    },

    get(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
      }
    },

    clear() {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
      }
    }
  },

  /**
   * Convert file to base64
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Get evidence type icon
   */
  getEvidenceIcon(type) {
    const icons = {
      photo: '📷',
      video: '📹',
      audio: '🎤',
      chat_log: '💬',
      document: '📄'
    };
    return icons[type] || '📄';
  },

  /**
   * Get contact type icon
   */
  getContactIcon(type) {
    const icons = {
      personal: '👤',
      police: '👮',
      she_team: '👩‍✈️',
      volunteer: '🤝',
      transgender: '🏳️‍⚧️'
    };
    return icons[type] || '👤';
  },

  /**
   * Logger utility
   */
  log: {
    info(...args) {
      if (CONFIG.DEBUG && CONFIG.LOG_LEVEL === 'info') {
        console.log('ℹ️', ...args);
      }
    },

    warn(...args) {
      if (CONFIG.DEBUG && ['info', 'warn'].includes(CONFIG.LOG_LEVEL)) {
        console.warn('⚠️', ...args);
      }
    },

    error(...args) {
      if (CONFIG.DEBUG) {
        console.error('❌', ...args);
      }
    },

    success(...args) {
      if (CONFIG.DEBUG && CONFIG.LOG_LEVEL === 'info') {
        console.log('✅', ...args);
      }
    }
  }
};
