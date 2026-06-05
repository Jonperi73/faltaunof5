import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDbKKor8th5e_8m4IlIDQXd_QVf9NO5gOk",
  authDomain: "falta-uno-f5.firebaseapp.com",
  projectId: "falta-uno-f5",
  storageBucket: "falta-uno-f5.firebasestorage.app",
  messagingSenderId: "780774002737",
  appId: "1:780774002737:web:1c4ceef07bd71fde004510"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.firebaseAuth = auth;
window.firebaseDB = db;

window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.signOutFirebase = signOut;
window.onAuthStateChangedFirebase = onAuthStateChanged;

window.docFirestore = doc;
window.setDocFirestore = setDoc;
window.getDocFirestore = getDoc;

console.log("Firebase conectado");