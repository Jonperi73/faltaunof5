import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

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

window.firebaseAuth = auth;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;

console.log("Firebase conectado");