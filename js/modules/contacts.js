/**
 * Contacts Module - Manages emergency contacts
 */

class ContactsManager {
  constructor() {
    this.contacts = [];
  }

  /**
   * Add emergency contact
   */
  async addContact(contactData) {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        throw new Error('User not logged in');
      }

      // Validate phone number
      if (contactData.phone_number && !Utils.isValidPhone(contactData.phone_number)) {
        throw new Error('Invalid phone number');
      }

      const contact = {
        user_id: user.id,
        name: contactData.name,
        phone_number: contactData.phone_number,
        relationship: contactData.relationship || '',
        priority: contactData.priority || 0,
        is_active: true,
        contact_type: contactData.contact_type || CONFIG.CONTACT_TYPES.PERSONAL,
        created_at: new Date().toISOString()
      };

      const id = await dbManager.add('emergency_contacts', contact);
      contact.id = id;

      Utils.log.success('Contact added:', id);
      Utils.showToast(CONFIG.SUCCESS.CONTACT_ADDED, 'success');

      return { success: true, contact };
    } catch (error) {
      Utils.log.error('Add contact error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all contacts for current user
   */
  async getContacts() {
    try {
      const user = userManager.getCurrentUser();
      if (!user) {
        return [];
      }

      let contacts = await dbManager.getByIndex('emergency_contacts', 'user_id', user.id);

      // Sort by priority (highest first)
      contacts.sort((a, b) => b.priority - a.priority);

      this.contacts = contacts;
      return contacts;
    } catch (error) {
      Utils.log.error('Get contacts error:', error);
      return [];
    }
  }

  /**
   * Get active contacts only
   */
  async getActiveContacts() {
    const allContacts = await this.getContacts();
    return allContacts.filter(contact => contact.is_active);
  }

  /**
   * Update contact
   */
  async updateContact(contactId, updates) {
    try {
      const contact = await dbManager.get('emergency_contacts', contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      // Validate phone number if being updated
      if (updates.phone_number && !Utils.isValidPhone(updates.phone_number)) {
        throw new Error('Invalid phone number');
      }

      const updatedContact = { ...contact, ...updates };
      await dbManager.update('emergency_contacts', updatedContact);

      Utils.log.success('Contact updated:', contactId);
      Utils.showToast('Contact updated successfully', 'success');

      return { success: true, contact: updatedContact };
    } catch (error) {
      Utils.log.error('Update contact error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId) {
    try {
      const confirmed = await Utils.confirm(
        'Are you sure you want to delete this contact?',
        'Delete Contact'
      );

      if (!confirmed) {
        return { success: false, cancelled: true };
      }

      await dbManager.delete('emergency_contacts', contactId);

      Utils.log.success('Contact deleted:', contactId);
      Utils.showToast('Contact deleted successfully', 'success');

      return { success: true };
    } catch (error) {
      Utils.log.error('Delete contact error:', error);
      Utils.showToast(error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle contact active status
   */
  async toggleContact(contactId) {
    try {
      const contact = await dbManager.get('emergency_contacts', contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      contact.is_active = !contact.is_active;
      await dbManager.update('emergency_contacts', contact);

      const status = contact.is_active ? 'activated' : 'deactivated';
      Utils.showToast(`Contact ${status}`, 'info');

      return { success: true, contact };
    } catch (error) {
      Utils.log.error('Toggle contact error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Render contacts list on settings screen
   */
  async renderContactsList() {
    try {
      const container = document.querySelector('#settings-screen .bg-gray-800.rounded-lg');
      if (!container) {
        Utils.log.warn('Contacts container not found');
        return;
      }

      const contacts = await this.getContacts();
      const personalContacts = contacts.filter(c => c.contact_type === CONFIG.CONTACT_TYPES.PERSONAL);

      if (personalContacts.length === 0) {
        // Keep the default contacts, add empty state for personal
        return;
      }

      // Add personal contacts to the list
      const personalContactsHTML = personalContacts.map(contact => `
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <div class="flex items-center">
            <span class="text-2xl mr-4">${Utils.getContactIcon(contact.contact_type)}</span>
            <div>
              <p class="font-semibold">${Utils.sanitize(contact.name)}</p>
              <p class="text-xs text-gray-400">${Utils.sanitize(contact.phone_number)}</p>
            </div>
          </div>
          <button onclick="contactsManager.deleteContact(${contact.id}).then(() => contactsManager.renderContactsList())"
                  class="text-red-400 hover:text-red-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      `).join('');

      // Append to existing contacts
      container.innerHTML += personalContactsHTML;

    } catch (error) {
      Utils.log.error('Render contacts error:', error);
    }
  }

  /**
   * Show add contact dialog
   */
  showAddContactDialog() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full text-white">
        <h2 class="text-2xl font-bold mb-4">Add Emergency Contact</h2>
        <form id="add-contact-form">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Name *</label>
            <input type="text" id="contact-name" required
                   class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Phone Number *</label>
            <input type="tel" id="contact-phone" required
                   class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Relationship</label>
            <input type="text" id="contact-relationship" placeholder="e.g., Mother, Friend"
                   class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Priority (0-10)</label>
            <input type="number" id="contact-priority" min="0" max="10" value="5"
                   class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
          </div>
          <div class="flex gap-3">
            <button type="button" onclick="this.closest('.fixed').remove()"
                    class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
              Cancel
            </button>
            <button type="submit"
                    class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
              Add Contact
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    // Handle form submission
    document.getElementById('add-contact-form').onsubmit = async (e) => {
      e.preventDefault();

      const contactData = {
        name: document.getElementById('contact-name').value,
        phone_number: document.getElementById('contact-phone').value,
        relationship: document.getElementById('contact-relationship').value,
        priority: parseInt(document.getElementById('contact-priority').value),
        contact_type: CONFIG.CONTACT_TYPES.PERSONAL
      };

      const result = await this.addContact(contactData);

      if (result.success) {
        modal.remove();
        await this.renderContactsList();
      }
    };
  }
}

// Create singleton instance
const contactsManager = new ContactsManager();
