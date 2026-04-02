// Firebase loaded dynamically to avoid npm dependency issues
let _auth: any = null;
let _RecaptchaVerifier: any = null;
let _signInWithPhoneNumber: any = null;
let _loaded = false;

export async function loadFirebase() {
  if (_loaded) return { auth: _auth, RecaptchaVerifier: _RecaptchaVerifier, signInWithPhoneNumber: _signInWithPhoneNumber };

  const [appModule, authModule] = await Promise.all([
    import(/* @vite-ignore */ "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
    import(/* @vite-ignore */ "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
  ]);

  const { initializeApp, getApps } = appModule;
  const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } = authModule;

  const firebaseConfig = {
    apiKey: "AIzaSyDBzE5UWzpRTSO5Mgc7LHor1XRG5r6q0nE",
    authDomain: "shiftchef-c9854.firebaseapp.com",
    projectId: "shiftchef-c9854",
    storageBucket: "shiftchef-c9854.firebasestorage.app",
    messagingSenderId: "1022473751207",
    appId: "1:1022473751207:web:2e6239953d614146572982",
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  _auth = getAuth(app);
  _RecaptchaVerifier = RecaptchaVerifier;
  _signInWithPhoneNumber = signInWithPhoneNumber;
  _loaded = true;

  return { auth: _auth, RecaptchaVerifier: _RecaptchaVerifier, signInWithPhoneNumber: _signInWithPhoneNumber };
}
