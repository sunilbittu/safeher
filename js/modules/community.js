/**
 * Community Module - Manages community responders
 */

class CommunityManager {
  constructor() {
    this.responders = [];
  }

  /**
   * Get all community responders
   */
  async getAllResponders() {
    try {
      const responders = await dbManager.getAll('community_responders');
      this.responders = responders;
      return responders;
    } catch (error) {
      Utils.log.error('Get responders error:', error);
      return [];
    }
  }

  /**
   * Get responders by type
   */
  async getRespondersByType(type) {
    try {
      const responders = await dbManager.getByIndex('community_responders', 'type', type);
      return responders;
    } catch (error) {
      Utils.log.error('Get responders by type error:', error);
      return [];
    }
  }

  /**
   * Get nearby responders based on location
   */
  async getNearbyResponders(latitude, longitude, radiusKm = 10) {
    try {
      const allResponders = await this.getAllResponders();

      // Filter responders with location data
      const respondersWithLocation = allResponders.filter(r => r.latitude && r.longitude);

      // Calculate distances and filter by radius
      const nearby = respondersWithLocation
        .map(responder => {
          const distance = Utils.calculateDistance(
            latitude,
            longitude,
            responder.latitude,
            responder.longitude
          );

          return {
            ...responder,
            distance: distance / 1000 // Convert to kilometers
          };
        })
        .filter(r => r.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      return nearby;
    } catch (error) {
      Utils.log.error('Get nearby responders error:', error);
      return [];
    }
  }

  /**
   * Send help request to responders
   */
  async sendHelpRequest(responderId = null) {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        throw new Error('User not logged in');
      }

      // Get current location
      const location = await Utils.getCurrentLocation();

      let responders = [];

      if (responderId) {
        // Send to specific responder
        const responder = await dbManager.get('community_responders', responderId);
        if (responder) responders = [responder];
      } else {
        // Send to all verified and available responders
        const allResponders = await this.getAllResponders();
        responders = allResponders.filter(r => r.is_verified && r.is_available);
      }

      if (responders.length === 0) {
        throw new Error('No available responders found');
      }

      // In a real app, this would send notifications to responders
      const message = `🚨 HELP REQUEST from ${user.name}\nLocation: ${location.latitude}, ${location.longitude}\nTime: ${new Date().toLocaleString()}`;

      Utils.log.info('Help request sent:', message, responders);
      Utils.showToast(`Help request sent to ${responders.length} responders`, 'success');

      return { success: true, responders, location };
    } catch (error) {
      Utils.log.error('Send help request error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Rate a responder
   */
  async rateResponder(responderId, rating) {
    try {
      if (rating < 0 || rating > 5) {
        throw new Error('Rating must be between 0 and 5');
      }

      const responder = await dbManager.get('community_responders', responderId);
      if (!responder) {
        throw new Error('Responder not found');
      }

      // Calculate new rating (simple average for now)
      const totalRating = responder.rating * responder.response_count + rating;
      responder.response_count += 1;
      responder.rating = totalRating / responder.response_count;

      await dbManager.update('community_responders', responder);

      Utils.log.success('Responder rated:', responderId, rating);
      Utils.showToast('Thank you for your feedback', 'success');

      return { success: true, responder };
    } catch (error) {
      Utils.log.error('Rate responder error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch and show community data
   */
  async showCommunity() {
    try {
      Utils.showLoading('Loading community data...');

      // Try to fetch from server
      const apiResult = await apiService.getCommunityData();

      Utils.hideLoading();

      if (apiResult.success && apiResult.data) {
        // Display the data
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
          <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full text-white max-h-screen overflow-y-auto">
            <div class="flex justify-between items-start mb-4">
              <h2 class="text-2xl font-bold">Community Data</h2>
              <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <pre class="bg-gray-900 p-4 rounded-lg text-sm overflow-auto">${JSON.stringify(apiResult.data, null, 2)}</pre>
          </div>
        `;
        document.body.appendChild(modal);
      } else {
        // Show local responders
        await this.showLocalResponders();
      }

      return { success: true };
    } catch (error) {
      Utils.hideLoading();
      Utils.log.error('Show community error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Show local responders
   */
  async showLocalResponders() {
    try {
      const responders = await this.getAllResponders();

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full text-white max-h-screen overflow-y-auto">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold">Community Responders</h2>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="space-y-3">
            ${responders.map(r => `
              <div class="bg-gray-900 p-4 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-bold">${Utils.getContactIcon(r.type)} ${Utils.sanitize(r.name)}</h3>
                  ${r.is_verified ? '<span class="text-xs bg-green-600 px-2 py-1 rounded">✓ Verified</span>' : ''}
                </div>
                <p class="text-sm text-gray-400">Type: ${r.type}</p>
                ${r.phone_number ? `<p class="text-sm text-gray-400">Phone: ${r.phone_number}</p>` : ''}
                ${r.rating ? `<p class="text-sm text-gray-400">Rating: ${'⭐'.repeat(Math.round(r.rating))} (${r.rating.toFixed(1)})</p>` : ''}
                ${r.response_count ? `<p class="text-sm text-gray-400">Responses: ${r.response_count}</p>` : ''}
                <button onclick="communityManager.sendHelpRequest(${r.id}).then(() => this.closest('.fixed').remove())"
                        class="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                  Request Help
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      document.body.appendChild(modal);

    } catch (error) {
      Utils.log.error('Show local responders error:', error);
    }
  }

  /**
   * Add new responder (admin function)
   */
  async addResponder(responderData) {
    try {
      const responder = {
        name: responderData.name,
        type: responderData.type,
        phone_number: responderData.phone_number || null,
        latitude: responderData.latitude || null,
        longitude: responderData.longitude || null,
        address: responderData.address || null,
        is_verified: responderData.is_verified || false,
        is_available: true,
        rating: 0,
        response_count: 0,
        created_at: new Date().toISOString()
      };

      const id = await dbManager.add('community_responders', responder);
      responder.id = id;

      Utils.log.success('Responder added:', id);
      Utils.showToast('Responder added successfully', 'success');

      return { success: true, responder };
    } catch (error) {
      Utils.log.error('Add responder error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const communityManager = new CommunityManager();
