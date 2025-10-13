/**
 * DatabaseManager - Handles all database operations using IndexedDB
 * IndexedDB is used instead of SQLite for better browser compatibility
 */

class DatabaseManager {
  constructor() {
    this.dbName = 'SafeHerDB';
    this.version = 1;
    this.db = null;
  }

  /**
   * Initialize the database and create object stores
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Database failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Database opened successfully');
        resolve(this.db);
      };

      // This runs when database is first created or version is upgraded
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('🔧 Setting up database stores...');

        // 1. Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
          userStore.createIndex('phone_number', 'phone_number', { unique: true });
          userStore.createIndex('email', 'email', { unique: false });
        }

        // 2. Emergency Contacts store
        if (!db.objectStoreNames.contains('emergency_contacts')) {
          const contactStore = db.createObjectStore('emergency_contacts', { keyPath: 'id', autoIncrement: true });
          contactStore.createIndex('user_id', 'user_id', { unique: false });
          contactStore.createIndex('contact_type', 'contact_type', { unique: false });
        }

        // 3. Evidence store
        if (!db.objectStoreNames.contains('evidence')) {
          const evidenceStore = db.createObjectStore('evidence', { keyPath: 'id', autoIncrement: true });
          evidenceStore.createIndex('user_id', 'user_id', { unique: false });
          evidenceStore.createIndex('type', 'type', { unique: false });
          evidenceStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // 4. SOS Alerts store
        if (!db.objectStoreNames.contains('sos_alerts')) {
          const sosStore = db.createObjectStore('sos_alerts', { keyPath: 'id', autoIncrement: true });
          sosStore.createIndex('user_id', 'user_id', { unique: false });
          sosStore.createIndex('status', 'status', { unique: false });
          sosStore.createIndex('triggered_at', 'triggered_at', { unique: false });
        }

        // 5. Location History store
        if (!db.objectStoreNames.contains('location_history')) {
          const locationStore = db.createObjectStore('location_history', { keyPath: 'id', autoIncrement: true });
          locationStore.createIndex('user_id', 'user_id', { unique: false });
          locationStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 6. Safe Zones store
        if (!db.objectStoreNames.contains('safe_zones')) {
          const safeZoneStore = db.createObjectStore('safe_zones', { keyPath: 'id', autoIncrement: true });
          safeZoneStore.createIndex('user_id', 'user_id', { unique: false });
        }

        // 7. User Preferences store
        if (!db.objectStoreNames.contains('user_preferences')) {
          const prefStore = db.createObjectStore('user_preferences', { keyPath: 'id', autoIncrement: true });
          prefStore.createIndex('user_id', 'user_id', { unique: true });
        }

        // 8. Community Responders store
        if (!db.objectStoreNames.contains('community_responders')) {
          const communityStore = db.createObjectStore('community_responders', { keyPath: 'id', autoIncrement: true });
          communityStore.createIndex('type', 'type', { unique: false });
          communityStore.createIndex('is_verified', 'is_verified', { unique: false });
        }

        // 9. Fake Call Templates store
        if (!db.objectStoreNames.contains('fake_call_templates')) {
          const templateStore = db.createObjectStore('fake_call_templates', { keyPath: 'id', autoIncrement: true });
          templateStore.createIndex('user_id', 'user_id', { unique: false });
        }

        // 10. Risk Detections store
        if (!db.objectStoreNames.contains('risk_detections')) {
          const riskStore = db.createObjectStore('risk_detections', { keyPath: 'id', autoIncrement: true });
          riskStore.createIndex('user_id', 'user_id', { unique: false });
          riskStore.createIndex('risk_level', 'risk_level', { unique: false });
        }

        console.log('✅ Database stores created');
      };
    });
  }

  /**
   * Generic method to add data to a store
   */
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // Add timestamp if not present
      if (!data.created_at) {
        data.created_at = new Date().toISOString();
      }

      const request = store.add(data);

      request.onsuccess = () => {
        resolve(request.result); // Returns the ID of the added record
      };

      request.onerror = () => {
        console.error(`Error adding to ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a single record by ID
   */
  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all records from a store
   */
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get records by index value
   */
  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Update an existing record
   */
  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`Error updating ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a record by ID
   */
  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Initialize default data
   */
  async initializeDefaultData() {
    try {
      // Check if community responders already exist
      const count = await this.count('community_responders');

      if (count === 0) {
        console.log('🔧 Adding default community responders...');

        const defaultResponders = [
          {
            name: 'City Police Station',
            type: 'police',
            phone_number: '100',
            is_verified: true,
            is_available: true,
            rating: 5.0,
            response_count: 0
          },
          {
            name: 'She Teams Helpline',
            type: 'she_team',
            phone_number: '181',
            is_verified: true,
            is_available: true,
            rating: 5.0,
            response_count: 0
          },
          {
            name: 'Women Safety Helpline',
            type: 'police',
            phone_number: '1091',
            is_verified: true,
            is_available: true,
            rating: 5.0,
            response_count: 0
          },
          {
            name: 'Verified Local Volunteer',
            type: 'volunteer',
            phone_number: '',
            is_verified: true,
            is_available: true,
            rating: 4.5,
            response_count: 0
          },
          {
            name: 'Transgender Community Responder',
            type: 'transgender',
            phone_number: '',
            is_verified: true,
            is_available: true,
            rating: 4.8,
            response_count: 0
          }
        ];

        for (const responder of defaultResponders) {
          await this.add('community_responders', responder);
        }

        console.log('✅ Default community responders added');
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }

  /**
   * Delete the entire database (use with caution!)
   */
  static deleteDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('SafeHerDB');

      request.onsuccess = () => {
        console.log('Database deleted successfully');
        resolve(true);
      };

      request.onerror = () => {
        console.error('Error deleting database:', request.error);
        reject(request.error);
      };
    });
  }
}

// Create a singleton instance
const dbManager = new DatabaseManager();
