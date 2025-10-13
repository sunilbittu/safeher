/**
 * API Service for SafeHer application
 * Handles all backend API communications
 */

class APIService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.offlineQueue = [];
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      Utils.log.info('API Request:', url, config);

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      Utils.log.success('API Response:', data);
      return { success: true, data };

    } catch (error) {
      Utils.log.error('API Error:', error);

      // Add to offline queue if network error
      if (!navigator.onLine) {
        this.addToOfflineQueue({ endpoint, options });
        Utils.showToast('Request queued. Will sync when online.', 'warning');
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Send user location data to server
   */
  async sendLocation(locationData) {
    return this.post(CONFIG.API_ENDPOINTS.CATCH, {
      type: 'location',
      ...locationData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send SOS alert to server
   */
  async sendSOSAlert(sosData) {
    return this.post(CONFIG.API_ENDPOINTS.CATCH, {
      type: 'sos_alert',
      ...sosData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get community responders data
   */
  async getCommunityData() {
    return this.get(CONFIG.API_ENDPOINTS.COMMUNITY);
  }

  /**
   * Send evidence metadata to server (not the file itself)
   */
  async sendEvidenceMetadata(evidenceData) {
    return this.post(CONFIG.API_ENDPOINTS.CATCH, {
      type: 'evidence',
      ...evidenceData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Upload file to server (for future implementation)
   */
  async uploadFile(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    try {
      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        body: formData
        // Don't set Content-Type header, browser will set it with boundary
      });

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      Utils.log.error('File upload error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync user data with server
   */
  async syncUserData(userData) {
    return this.post(CONFIG.API_ENDPOINTS.CATCH, {
      type: 'user_sync',
      ...userData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Add request to offline queue
   */
  addToOfflineQueue(request) {
    this.offlineQueue.push(request);
    Utils.storage.set(CONFIG.STORAGE_KEYS.OFFLINE_QUEUE, this.offlineQueue);
    Utils.log.info('Added to offline queue:', request);
  }

  /**
   * Process offline queue when back online
   */
  async processOfflineQueue() {
    const queue = Utils.storage.get(CONFIG.STORAGE_KEYS.OFFLINE_QUEUE) || [];

    if (queue.length === 0) {
      return;
    }

    Utils.log.info('Processing offline queue:', queue.length, 'items');

    const results = [];
    for (const request of queue) {
      const result = await this.request(request.endpoint, request.options);
      results.push(result);
    }

    // Clear the queue after processing
    Utils.storage.remove(CONFIG.STORAGE_KEYS.OFFLINE_QUEUE);
    this.offlineQueue = [];

    Utils.showToast('Offline data synced successfully', 'success');
    return results;
  }

  /**
   * Check server health
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Initialize online/offline event listeners
   */
  initNetworkListeners() {
    window.addEventListener('online', async () => {
      Utils.showToast('Back online! Syncing data...', 'info');
      await this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      Utils.showToast('You are offline. Data will sync when online.', 'warning');
    });

    Utils.log.info('Network listeners initialized');
  }
}

// Create singleton instance
const apiService = new APIService();
