// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCw8WmZfhBIuYJVw34gTE6LlEfOE0e1Dqo",
  authDomain: "eatify-22231.firebaseapp.com",
  databaseURL: "https://eatify-22231-default-rtdb.firebaseio.com",
  projectId: "eatify-22231",
  storageBucket: "eatify-22231.appspot.com",
  messagingSenderId: "579212375301",
  appId: "1:579212375301:web:c29702497965d6e376f36c",
  measurementId: "G-Y7WG36CDV3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth: Auth = getAuth(app);
export { auth };

// Initialize Firestore
export const db = getFirestore(app);

export default app;
