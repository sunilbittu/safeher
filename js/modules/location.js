/**
 * Location Module - Handles location tracking and safe zones
 */

class LocationManager {
  constructor() {
    this.tracking = false;
    this.trackingInterval = null;
    this.watchId = null;
  }

  /**
   * Save location to history
   */
  async saveLocation(location) {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not logged in' };
      }

      const locationRecord = {
        user_id: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || null,
        timestamp: location.timestamp || new Date().toISOString(),
        address: location.address || null,
        is_safe_zone: await this.isInSafeZone(location.latitude, location.longitude)
      };

      const id = await dbManager.add('location_history', locationRecord);
      locationRecord.id = id;

      Utils.log.info('Location saved:', id);

      return { success: true, location: locationRecord };
    } catch (error) {
      Utils.log.error('Save location error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get location history
   */
  async getLocationHistory(limit = 100) {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        return [];
      }

      let locations = await dbManager.getByIndex('location_history', 'user_id', user.id);

      // Sort by timestamp (newest first)
      locations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Limit results
      if (limit) {
        locations = locations.slice(0, limit);
      }

      return locations;
    } catch (error) {
      Utils.log.error('Get location history error:', error);
      return [];
    }
  }

  /**
   * Start continuous location tracking
   */
  async startTracking() {
    if (this.tracking) {
      Utils.log.warn('Location tracking already active');
      return;
    }

    try {
      this.tracking = true;

      if ('geolocation' in navigator && 'watchPosition' in navigator.geolocation) {
        this.watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            };

            await this.saveLocation(location);
            await apiService.sendLocation(location);
          },
          (error) => {
            Utils.log.error('Location tracking error:', error);
          },
          {
            enableHighAccuracy: CONFIG.LOCATION.HIGH_ACCURACY,
            timeout: CONFIG.LOCATION.TIMEOUT,
            maximumAge: CONFIG.LOCATION.MAX_AGE
          }
        );

        Utils.log.success('Location tracking started');
        Utils.showToast('Location tracking active', 'success');
      }

      return { success: true };
    } catch (error) {
      Utils.log.error('Start tracking error:', error);
      this.tracking = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop location tracking
   */
  stopTracking() {
    if (!this.tracking) {
      return;
    }

    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    this.tracking = false;
    Utils.log.info('Location tracking stopped');
    Utils.showToast('Location tracking stopped', 'info');
  }

  /**
   * Check if location is in a safe zone
   */
  async isInSafeZone(latitude, longitude) {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        return false;
      }

      const safeZones = await dbManager.getByIndex('safe_zones', 'user_id', user.id);
      const activeSafeZones = safeZones.filter(zone => zone.is_active);

      for (const zone of activeSafeZones) {
        const distance = Utils.calculateDistance(
          latitude,
          longitude,
          zone.latitude,
          zone.longitude
        );

        if (distance <= zone.radius) {
          return true;
        }
      }

      return false;
    } catch (error) {
      Utils.log.error('Check safe zone error:', error);
      return false;
    }
  }

  /**
   * Add a safe zone
   */
  async addSafeZone(name, latitude, longitude, radius = 100) {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        throw new Error('User not logged in');
      }

      const safeZone = {
        user_id: user.id,
        name,
        latitude,
        longitude,
        radius,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const id = await dbManager.add('safe_zones', safeZone);
      safeZone.id = id;

      Utils.log.success('Safe zone added:', id);
      Utils.showToast('Safe zone added successfully', 'success');

      return { success: true, safeZone };
    } catch (error) {
      Utils.log.error('Add safe zone error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all safe zones
   */
  async getSafeZones() {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        return [];
      }

      const safeZones = await dbManager.getByIndex('safe_zones', 'user_id', user.id);
      return safeZones;
    } catch (error) {
      Utils.log.error('Get safe zones error:', error);
      return [];
    }
  }

  /**
   * Delete safe zone
   */
  async deleteSafeZone(zoneId) {
    try {
      await dbManager.delete('safe_zones', zoneId);
      Utils.showToast('Safe zone deleted', 'success');
      return { success: true };
    } catch (error) {
      Utils.log.error('Delete safe zone error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Share location with contacts
   */
  async shareLocation() {
    try {
      Utils.showLoading('Getting your location...');
      const location = await Utils.getCurrentLocation();
      Utils.hideLoading();

      // Save to history
      await this.saveLocation(location);

      // Send to server
      await apiService.sendLocation(location);

      // Notify contacts
      const user = userManager.getCurrentUser();
      const message = `📍 Location shared by ${user.name}\nLat: ${location.latitude}\nLng: ${location.longitude}\n${new Date().toLocaleString()}`;

      Utils.log.info('Location shared:', message);
      Utils.showToast(CONFIG.SUCCESS.LOCATION_SHARED, 'success');

      return { success: true, location };
    } catch (error) {
      Utils.log.error('Share location error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const locationManager = new LocationManager();
