# 🚀 SafeHer Quick Start Guide

## Getting Started in 3 Steps

### Step 1: Open the Application
```bash
# Simply open index.html in your browser
# Double-click index.html OR
# Right-click → Open with → Your Browser
```

### Step 2: Login or Continue as Guest
- **Login**: Enter a phone number (any valid format works for testing)
- **Guest Mode**: Click "Continue as Guest" for instant access

### Step 3: Explore Features!
You're ready to use all dynamic features!

---

## 🎯 Quick Feature Guide

### 🆘 SOS Alert
1. Click the big **SOS** button on home screen
2. 3-second countdown starts
3. Alert is logged to database with location
4. Emergency contacts notified

**Test it:** Check browser console to see database logs!

### 📸 Evidence Vault
1. Navigate to **Evidence** tab (bottom nav)
2. Click **"Add First Evidence"** or upload icon
3. Select a photo/video/audio file
4. File stored in database with metadata

**Test it:** Upload an image, then refresh page - it persists!

### 📞 Fake Call
1. Click **"Fake Call"** on home screen
2. Incoming call overlay appears
3. Accept to hear conversation
4. Change language in real-time

**Test it:** Try all three languages (English, Hindi, Telugu)!

### 📍 Share Location
1. Click **"Share Location"** on home screen
2. Grant location permissions
3. Location saved to database
4. Sent to API (if configured)

**Test it:** Check browser console for location coordinates!

### 🛡️ Community
1. Click **"Community"** on home screen
2. View verified responders
3. Request help from specific responder
4. View ratings and response count

**Test it:** Default responders are pre-loaded in database!

### ⚙️ Settings
1. Navigate to **Settings** tab (bottom nav)
2. Add emergency contacts
3. View emergency network
4. Manage preferences

**Test it:** Add a contact and check if it persists on refresh!

---

## 🧪 Testing the Dynamic Features

### Test 1: Data Persistence
```
1. Login as guest
2. Add an evidence file
3. Refresh the browser (F5)
4. Check if evidence still exists ✅
```

### Test 2: Database Operations
```
1. Open browser console (F12)
2. Type: userManager.getCurrentUser()
3. See your user data ✅
4. Type: evidenceManager.getEvidenceList()
5. See your evidence ✅
```

### Test 3: Offline Functionality
```
1. Disconnect internet
2. Add evidence, trigger SOS, etc.
3. Everything still works! ✅
4. Reconnect - data syncs to API ✅
```

---

## 🔍 Viewing Your Data

### Using Browser DevTools:

1. **Open DevTools** (F12 or Right-click → Inspect)

2. **Go to Application Tab**

3. **IndexedDB → SafeHerDB**
   - View all stores (tables)
   - See real data
   - Inspect records

4. **Console Tab**
   - Test managers directly
   - See logs and errors
   - Debug in real-time

### Example Console Commands:
```javascript
// Get current user
userManager.getCurrentUser()

// Get all evidence
evidenceManager.getEvidenceList()

// Get SOS history
sosManager.getAlertHistory()

// Get emergency contacts
contactsManager.getContacts()

// Get app status
app.getStatus()

// View database
dbManager.getAll('users')
dbManager.getAll('evidence')
dbManager.getAll('sos_alerts')
```

---

## 📊 Understanding the Data Flow

### Example: Triggering SOS

```
User clicks SOS button
    ↓
navigationManager.navigateTo('sos-screen')
    ↓
sosManager.startCountdown()
    ↓
3... 2... 1...
    ↓
sosManager.triggerSOS()
    ↓
locationManager.getCurrentLocation()
    ↓
dbManager.add('sos_alerts', data)
    ↓
apiService.sendSOSAlert(data)
    ↓
contactsManager.notifyEmergencyContacts()
    ↓
UI updates with success message
```

---

## 🎨 Customization Guide

### Change App Name:
Edit `index.html` line 6:
```html
<title>Your App Name</title>
```

### Change API Endpoint:
Edit `js/config.js`:
```javascript
API_BASE_URL: 'https://your-domain.com/api'
```

### Change Splash Duration:
Edit `js/config.js`:
```javascript
SPLASH_DURATION: 5000  // 5 seconds instead of 3
```

### Add More Languages:
Edit `js/config.js` and add to `FAKE_CALL_SCRIPTS`:
```javascript
FAKE_CALL_SCRIPTS: {
  en: [...],
  hi: [...],
  te: [...],
  es: ["Hola, ¿dónde estás?", "¿Estás bien?", ...]  // Spanish
}
```

---

## 🐛 Quick Troubleshooting

### Problem: "Nothing happens when I click"
**Solution:** Check browser console for JavaScript errors

### Problem: "Data not saving"
**Solution:** Ensure browser supports IndexedDB (all modern browsers do)

### Problem: "Location not working"
**Solution:**
- Grant location permissions
- Use HTTPS or localhost
- Check browser location settings

### Problem: "Files not uploading"
**Solution:**
- Check file size (max 50MB)
- Use supported formats (images, videos, audio)
- Check browser storage quota

### Problem: "Page is blank"
**Solution:**
- Check if all JS files are in correct folders
- Open console and check for 404 errors
- Verify file paths in index.html

---

## 📱 Mobile Testing

### Test on Phone/Tablet:
1. Use a local server (see below)
2. Access from mobile browser
3. Test touch gestures
4. Test location on mobile
5. Test file uploads from camera

### Quick Local Server:
```bash
# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000
```

Or use VS Code "Live Server" extension.

---

## 💡 Tips & Tricks

### Tip 1: Clear All Data
```javascript
// In browser console:
indexedDB.deleteDatabase('SafeHerDB')
// Then refresh page
```

### Tip 2: View App in Mobile View
- F12 → Toggle device toolbar
- Or Ctrl+Shift+M (Windows) / Cmd+Shift+M (Mac)

### Tip 3: Test Different Users
- Clear browser data
- Use incognito/private mode
- Login with different phone numbers

### Tip 4: Export Your Data
```javascript
// In console:
preferencesManager.exportPreferences()
// Downloads JSON file
```

---

## 🎉 You're All Set!

Your SafeHer app is now:
- ✅ Fully dynamic
- ✅ Database-driven
- ✅ Offline-capable
- ✅ Production-ready

### Next Steps:
1. Explore all features
2. Add your own data
3. Customize to your needs
4. Deploy to production
5. Connect to backend API

---

## 📚 More Resources

- Full Documentation: `README.md`
- Database Schema: `sql/schema.sql`
- Code Comments: Check individual JS files
- Config Options: `js/config.js`

---

**Happy Testing! 🚀**

Need help? Check the browser console for detailed logs!
