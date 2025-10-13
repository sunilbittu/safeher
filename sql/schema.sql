-- SafeHer Database Schema
-- SQLite Database for Women's Safety Application

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE,
    name TEXT,
    email TEXT,
    is_guest BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- 2. Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    relationship TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    contact_type TEXT, -- 'personal', 'police', 'she_team', 'volunteer', 'transgender'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Evidence Vault
CREATE TABLE IF NOT EXISTS evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL, -- 'photo', 'video', 'audio', 'chat_log', 'document'
    title TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    thumbnail_path TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT 1,
    is_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    location_lat REAL,
    location_lng REAL,
    metadata TEXT, -- JSON for additional info
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. SOS Alerts Log
CREATE TABLE IF NOT EXISTS sos_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    location_lat REAL,
    location_lng REAL,
    location_address TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'resolved'
    resolved_at DATETIME,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Location History
CREATE TABLE IF NOT EXISTS location_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    address TEXT,
    is_safe_zone BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Safe Zones
CREATE TABLE IF NOT EXISTS safe_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL, -- 'Home', 'Work', 'Friend''s Place'
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius INTEGER DEFAULT 100, -- meters
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    invisible_gestures BOOLEAN DEFAULT 1,
    theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'en',
    fake_call_contact_name TEXT DEFAULT 'Mom',
    fake_call_language TEXT DEFAULT 'en',
    auto_record_sos BOOLEAN DEFAULT 1,
    share_location_auto BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Community/Responders
CREATE TABLE IF NOT EXISTS community_responders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'police', 'she_team', 'volunteer', 'transgender'
    phone_number TEXT,
    latitude REAL,
    longitude REAL,
    address TEXT,
    is_verified BOOLEAN DEFAULT 0,
    is_available BOOLEAN DEFAULT 1,
    rating REAL DEFAULT 0,
    response_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Fake Call Templates
CREATE TABLE IF NOT EXISTS fake_call_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    caller_name TEXT DEFAULT 'Mom',
    caller_image_url TEXT,
    language TEXT DEFAULT 'en',
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Risk Detection Log
CREATE TABLE IF NOT EXISTS risk_detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    location_lat REAL,
    location_lng REAL,
    risk_level TEXT, -- 'low', 'medium', 'high'
    risk_factors TEXT, -- JSON array
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_user ON evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(type);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_user ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_location_history_user ON location_history(user_id);
CREATE INDEX IF NOT EXISTS idx_safe_zones_user ON safe_zones(user_id);
CREATE INDEX IF NOT EXISTS idx_community_type ON community_responders(type);

-- Insert default community responders (sample data)
INSERT OR IGNORE INTO community_responders (name, type, phone_number, is_verified, is_available) VALUES
('City Police Station', 'police', '100', 1, 1),
('She Teams Helpline', 'she_team', '181', 1, 1),
('Women Safety Helpline', 'police', '1091', 1, 1),
('Verified Local Volunteer', 'volunteer', '', 1, 1),
('Transgender Community Responder', 'transgender', '', 1, 1);
