# प्रिमियम भजन - Premium Bhajan Music Player

A beautiful music player website with Firebase real-time viewer count.

## Features
- 🎵 Music player with play/pause controls
- ⏮️ Previous/Next track navigation
- 📊 Progress bar with seek functionality
- 👥 Real-time online viewer count using Firebase
- 🎨 Beautiful illustrated background design
- 📱 Fully responsive design
- 🔗 External links to Spotify and YouTube Music

## Firebase Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "premium-bhajan")
4. Follow the setup wizard

### Step 2: Enable Realtime Database
1. In your Firebase project, go to "Build" → "Realtime Database"
2. Click "Create Database"
3. Start in **test mode** (you can add security rules later)
4. Choose your database location

### Step 3: Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click on the web icon (</>)
4. Register your app
5. Copy the Firebase configuration object

### Step 4: Update Configuration
Open `firebase-config.js` and replace the placeholder values with your Firebase credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 5: Set Security Rules (Optional but Recommended)
In Firebase Console → Realtime Database → Rules, update to:

```json
{
  "rules": {
    "onlineUsers": {
      ".read": true,
      ".write": true
    }
  }
}
```

## How It Works

### Live Viewer Count
- When a user opens the website, their presence is registered in Firebase
- The online count updates in real-time for all connected users
- When a user closes the tab/browser, they're automatically removed from the count
- Uses Firebase's connection state monitoring for accurate tracking

## Files Structure
```
Bhajan/
├── index.html           # Main HTML structure
├── style.css            # Styling and design
├── script.js            # Music player functionality
├── firebase-config.js   # Firebase configuration and setup
└── README.md            # This file
```

## Usage
1. Complete Firebase setup (see above)
2. Open `index.html` in a web browser
3. The viewer count will update automatically
4. Use the music player controls to play/pause and navigate tracks

## Customization

### Add Real Audio Files
To add actual audio playback, update the playlist in `script.js`:

```javascript
const playlist = [
    {
        title: "Your Song Title",
        artist: "Artist Name",
        duration: "4:30",
        albumArt: "path/to/album-art.jpg",
        audioSrc: "path/to/audio-file.mp3"  // Add this
    }
];
```

### Change Colors
Edit the gradient in `style.css`:

```css
body {
    background: linear-gradient(135deg, #c77b5e 0%, #a85a45 50%, #5c8dad 100%);
}
```

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## License
Free to use for personal and commercial projects.
