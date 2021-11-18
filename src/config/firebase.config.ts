// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFunctions } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbbs_ikrStgzElUBpN7M3riQXQDWityW4",
  authDomain: "gh-action-stats.firebaseapp.com",
  projectId: "gh-action-stats",
  storageBucket: "gh-action-stats.appspot.com",
  messagingSenderId: "244765083185",
  appId: "1:244765083185:web:a06e967f3a71099a343710",
  measurementId: "G-0FGTK1Y24L"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
export const functions = getFunctions(app);
