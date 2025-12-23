// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyCFMhJ9KV738dSvb46IogqC3myjtSaj5Nw",
authDomain: "landry-regan-cookbook.firebaseapp.com",
projectId: "landry-regan-cookbook",
storageBucket: "landry-regan-cookbook.firebasestorage.app",
messagingSenderId: "366289651898",
appId: "1:366289651898:web:34740ac805a4e4696b1a83"
};

// Initialize Firebase
const appfb = initializeApp(firebaseConfig);
export const database = getDatabase(appfb);
export const auth = getAuth(appfb);
