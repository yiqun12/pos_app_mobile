import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  // @ts-expect-error - getReactNativePersistence exists in the RN build but is not exported from the default `firebase/auth` types
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

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

const app = initializeApp(firebaseConfig);

const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export { auth };

export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;
