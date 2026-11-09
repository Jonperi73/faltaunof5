import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, runTransaction } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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
Object.assign(window, {
  firebaseAuth: auth, firebaseDB: db,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOutFirebase: signOut, onAuthStateChangedFirebase: onAuthStateChanged,
  docFirestore: doc, setDocFirestore: setDoc, getDocFirestore: getDoc,
  listFirestoreUsers: async () => {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  },
  getFirestoreTournaments: async () => {
    const snap = await getDocs(collection(db, "tournaments"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  createFirestoreTournament: async tournament => {
    await setDoc(doc(db, "tournaments", tournament.id), tournament);
  },
  registerFirestoreTeam: async (tournamentId, team) => runTransaction(db, async tx => {
    const ref = doc(db, "tournaments", tournamentId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("El torneo ya no existe.");
    const tournament = snap.data();
    if (tournament.started) throw new Error("La inscripción está cerrada.");
    if (tournament.teams.some(t => t.name.toLowerCase() === team.name.toLowerCase()))
      throw new Error("Ya existe un equipo con ese nombre.");
    const roster = [...team.players, ...team.substitutes];
    const occupied = tournament.teams.flatMap(t => [...t.players, ...t.substitutes]);
    const conflict = roster.find(username => occupied.includes(username));
    if (conflict) throw new Error(conflict + " ya está inscripto en otro equipo de este torneo.");
    tournament.teams.push(team);
    tx.update(ref, { teams: tournament.teams });
    return tournament;
  }),
  startFirestoreTournament: async (tournamentId, matches) => runTransaction(db, async tx => {
    const ref = doc(db, "tournaments", tournamentId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("El torneo ya no existe.");
    const tournament = snap.data();
    if (tournament.started) throw new Error("El torneo ya fue iniciado.");
    if (tournament.teams.length < 2) throw new Error("Necesitás al menos 2 equipos.");
    tx.update(ref, { matches, started: true, startedAt: Date.now() });
    return { ...tournament, matches, started: true };
  })
});
console.log("Firebase conectado");