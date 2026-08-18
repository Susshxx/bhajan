// Firebase Configuration
// Replace these values with your Firebase project credentials

const firebaseConfig = {
  apiKey: "AIzaSyDBHpc9zTrAMxarbgaFkPzM1fawyD_Nc3w",
  authDomain: "bhajanns.firebaseapp.com",
  databaseURL: "https://bhajanns-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bhajanns",
  storageBucket: "bhajanns.firebasestorage.app",
  messagingSenderId: "115105444083",
  appId: "1:115105444083:web:6dd26cf6f037b600038786",
  measurementId: "G-KV6HD13MTF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Reference to online users count
const onlineUsersRef = database.ref('onlineUsers');
const userPresenceRef = database.ref('.info/connected');

// Generate unique session ID
const sessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
const myConnectionRef = onlineUsersRef.child(sessionId);

// Monitor connection state
userPresenceRef.on('value', (snapshot) => {
    if (snapshot.val()) {
        // User is connected
        myConnectionRef.set(true);
        
        // Remove this user when they disconnect
        myConnectionRef.onDisconnect().remove();
    }
});

// Listen for online count changes
onlineUsersRef.on('value', (snapshot) => {
    const onlineCount = snapshot.numChildren();
    updateOnlineCountDisplay(onlineCount);
});

// Update the display
function updateOnlineCountDisplay(count) {
    const onlineCountEl = document.querySelector('.online-count');
    if (onlineCountEl) {
        onlineCountEl.textContent = Number(count) || 0;
    }
}
