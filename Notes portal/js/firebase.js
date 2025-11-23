// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuucrbpkhEBOwCK7n_bNykhcQqaRuGjR0",
  authDomain: "pagepop-8f02b.firebaseapp.com",
  projectId: "pagepop-8f02b",
  storageBucket: "pagepop-8f02b.firebasestorage.app",
  messagingSenderId: "359310892528",
  appId: "1:359310892528:web:8db4b16bb9ae6229111135",
  measurementId: "G-3GWHKT1X7N"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// your admin uid (you provided it earlier)
export const ADMIN_UID = "I22KZwN7rBVh49Ct0Ysru3NJsJf1";
