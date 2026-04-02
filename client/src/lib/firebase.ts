import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDBzE5UWzpRTSO5Mgc7LHor1XRG5r6q0nE",
  authDomain: "shiftchef-c9854.firebaseapp.com",
  projectId: "shiftchef-c9854",
  storageBucket: "shiftchef-c9854.firebasestorage.app",
  messagingSenderId: "1022473751207",
  appId: "1:1022473751207:web:2e6239953d614146572982",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Disable app verification for testing (remove in production)
// auth.settings.appVerificationDisabledForTesting = true;

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
