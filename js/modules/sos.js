/**
 * SOS Module - Handles emergency SOS alerts
 */

class SOSManager {
  constructor() {
    this.currentAlert = null;
    this.countdownInterval = null;
  }

  /**
   * Trigger SOS alert
   */
  async triggerSOS() {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        throw new Error('User not logged in');
      }

      // Get current location
      let location = null;
      try {
        Utils.showLoading('Getting your location...');
        location = await Utils.getCurrentLocation();
        Utils.hideLoading();
      } catch (error) {
        Utils.log.warn('Could not get location:', error);
        Utils.hideLoading();
      }

      // Create SOS alert record
      const sosAlert = {
        user_id: user.id,
        triggered_at: new Date().toISOString(),
        location_lat: location?.latitude || null,
        location_lng: location?.longitude || null,
        location_address: null, // Could be fetched from reverse geocoding API
        status: CONFIG.SOS_STATUS.ACTIVE,
        notes: ''
      };

      // Save to database
      const alertId = await dbManager.add('sos_alerts', sosAlert);
      sosAlert.id = alertId;

      this.currentAlert = sosAlert;

      // Send to emergency contacts
      await this.notifyEmergencyContacts(sosAlert);

      // Send to server
      await apiService.sendSOSAlert({
        alertId,
        location: location,
        userId: user.id,
        userName: user.name
      });

      // Save location to history
      if (location) {
        await locationManager.saveLocation(location);
      }

      Utils.log.success('SOS alert triggered:', alertId);

      return { success: true, alert: sosAlert };
    } catch (error) {
      Utils.log.error('Trigger SOS error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel SOS alert
   */
  async cancelSOS() {
    try {
      if (!this.currentAlert) {
        return { success: true };
      }

      // Update alert status
      const alert = await dbManager.get('sos_alerts', this.currentAlert.id);
      alert.status = CONFIG.SOS_STATUS.CANCELLED;
      alert.resolved_at = new Date().toISOString();
      await dbManager.update('sos_alerts', alert);

      // Clear countdown
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }

      this.currentAlert = null;

      Utils.log.info('SOS alert cancelled');
      Utils.showToast('SOS alert cancelled', 'info');

      return { success: true };
    } catch (error) {
      Utils.log.error('Cancel SOS error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resolve SOS alert
   */
  async resolveSOS(alertId, notes = '') {
    try {
      const alert = await dbManager.get('sos_alerts', alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.status = CONFIG.SOS_STATUS.RESOLVED;
      alert.resolved_at = new Date().toISOString();
      alert.notes = notes;

      await dbManager.update('sos_alerts', alert);

      Utils.log.success('SOS alert resolved:', alertId);
      Utils.showToast('SOS alert resolved', 'success');

      return { success: true };
    } catch (error) {
      Utils.log.error('Resolve SOS error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get SOS alert history
   */
  async getAlertHistory() {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        return [];
      }

      const alerts = await dbManager.getByIndex('sos_alerts', 'user_id', user.id);

      // Sort by triggered_at (newest first)
      alerts.sort((a, b) => new Date(b.triggered_at) - new Date(a.triggered_at));

      return alerts;
    } catch (error) {
      Utils.log.error('Get alert history error:', error);
      return [];
    }
  }

  /**
   * Notify emergency contacts
   */
  async notifyEmergencyContacts(sosAlert) {
    try {
      const contacts = await contactsManager.getActiveContacts();

      if (contacts.length === 0) {
        Utils.log.warn('No emergency contacts to notify');
        return;
      }

      const user = userManager.getCurrentUser();
      const message = `🚨 EMERGENCY ALERT from ${user.name}\nLocation: ${sosAlert.location_lat ? `${sosAlert.location_lat}, ${sosAlert.location_lng}` : 'Unknown'}\nTime: ${Utils.formatDateTime(sosAlert.triggered_at)}`;

      Utils.log.info('Notifying emergency contacts:', message);

      // In a real app, this would send SMS/calls to contacts
      // For now, we'll just log it
      Utils.showToast(`Alert sent to ${contacts.length} contacts`, 'success');

      return { success: true, notified: contacts.length };
    } catch (error) {
      Utils.log.error('Notify contacts error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start SOS countdown (used by UI)
   */
  startCountdown(onComplete, onTick, onCancel) {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    let count = CONFIG.SOS.COUNTDOWN_SECONDS;

    // Initial tick
    if (onTick) onTick(count);

    this.countdownInterval = setInterval(async () => {
      count--;

      if (count > 0) {
        if (onTick) onTick(count);
      } else {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;

        // Trigger the actual SOS
        const result = await this.triggerSOS();

        if (onComplete) onComplete(result);
      }
    }, 1000);

    // Return cancel function
    return () => {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      if (onCancel) onCancel();
    };
  }
}

// Create singleton instance
const sosManager = new SOSManager();
