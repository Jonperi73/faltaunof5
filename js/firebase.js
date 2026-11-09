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

  // Perfiles públicos y equipos permanentes (base del Mercado de Pases).
  // El WhatsApp se mantiene fuera del perfil público hasta implementar
  // una lectura controlada según la preferencia showWhatsapp.
  savePublicPlayerProfile: async profile => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Tenés que iniciar sesión.");
    const ref = doc(db, "player_profiles", uid);
    const payload = {
      userId: uid,
      username: String(profile.username || "").trim().toLowerCase(),
      name: String(profile.name || "").trim(),
      position: String(profile.position || "Cualquiera"),
      zone: String(profile.zone || "").trim(),
      description: String(profile.description || "").trim(),
      lookingForTeam: Boolean(profile.lookingForTeam),
      status: "active",
      updatedAt: Date.now()
    };
    await setDoc(ref, payload, { merge: true });
    return payload;
  },
  getPublicPlayerProfiles: async () => {
    const snap = await getDocs(collection(db, "player_profiles"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.status === "active");
  },
  createPermanentTeam: async team => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Tenés que iniciar sesión.");
    const teamId = crypto.randomUUID();
    const teamRef = doc(db, "teams", teamId);
    const memberRef = doc(db, "teams", teamId, "members", uid);
    const payload = {
      name: String(team.name || "").trim(),
      description: String(team.description || "").trim(),
      zone: String(team.zone || "").trim(),
      teamType: "permanent",
      createdBy: uid,
      adminId: uid,
      captainId: uid,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    if (!payload.name) throw new Error("El equipo necesita un nombre.");
    await runTransaction(db, async tx => {
      tx.set(teamRef, payload);
      tx.set(memberRef, {
        userId: uid, role: "captain", status: "active",
        joinedAt: Date.now()
      });
    });
    return { id: teamId, ...payload };
  },
  getActiveTeams: async () => {
    const snap = await getDocs(collection(db, "teams"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(t => t.status === "active");
  }
  
  // Publicaciones y solicitudes del Mercado de Pases.
  createTransferListing: async listing => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Tenés que iniciar sesión.");
    const kind = listing.kind;
    if (!["player", "team"].includes(kind)) throw new Error("Tipo de publicación inválido.");
    const listingId = crypto.randomUUID();
    const payload = {
      kind,
      ownerId: uid,
      title: String(listing.title || "").trim(),
      description: String(listing.description || "").trim(),
      zone: String(listing.zone || "").trim(),
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    if (!payload.title) throw new Error("La publicación necesita un título.");
    if (kind === "player") {
      payload.position = String(listing.position || "Cualquiera");
      payload.playerId = uid;
    } else {
      const teamId = String(listing.teamId || "");
      if (!teamId) throw new Error("Falta seleccionar el equipo.");
      const teamSnap = await getDoc(doc(db, "teams", teamId));
      if (!teamSnap.exists()) throw new Error("El equipo no existe.");
      const team = teamSnap.data();
      if (team.adminId !== uid && team.captainId !== uid)
        throw new Error("Solo el administrador o capitán puede publicar búsquedas.");
      payload.teamId = teamId;
      payload.teamName = team.name || "";
      payload.positionsNeeded = Array.isArray(listing.positionsNeeded) ? listing.positionsNeeded : [];
      payload.playersNeeded = Math.max(1, Number(listing.playersNeeded) || 1);
    }
    await setDoc(doc(db, "transfer_listings", listingId), payload);
    return { id: listingId, ...payload };
  },
  getActiveTransferListings: async kind => {
    const snap = await getDocs(collection(db, "transfer_listings"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(x => x.status === "active" && (!kind || x.kind === kind));
  },
  sendTransferRequest: async request => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Tenés que iniciar sesión.");
    const type = request.type;
    if (!["team_invitation", "player_application"].includes(type))
      throw new Error("Tipo de solicitud inválido.");
    const teamId = String(request.teamId || "");
    const playerId = String(request.playerId || "");
    if (!teamId || !playerId) throw new Error("Faltan datos del equipo o jugador.");
    if (type === "team_invitation" && uid !== playerId)
      throw new Error("La invitación debe enviarla el jugador destinatario o gestionarse desde el equipo.");
    const teamRef = doc(db, "teams", teamId);
    const playerRef = doc(db, "player_profiles", playerId);
    const requestId = type + "_" + teamId + "_" + playerId;
    const requestRef = doc(db, "transfer_requests", requestId);
    const notificationRef = doc(collection(db, "notifications"));
    await runTransaction(db, async tx => {
      const [teamSnap, playerSnap, existingSnap] = await Promise.all([
        tx.get(teamRef), tx.get(playerRef), tx.get(requestRef)
      ]);
      if (!teamSnap.exists()) throw new Error("El equipo no existe.");
      if (!playerSnap.exists()) throw new Error("El jugador todavía no tiene perfil público.");
      const team = teamSnap.data();
      if (type === "player_application" && uid !== playerId)
        throw new Error("Solo podés postularte con tu propia cuenta.");
      if (type === "team_invitation" && team.adminId !== uid && team.captainId !== uid)
        throw new Error("No tenés permisos para invitar jugadores.");
      if (existingSnap.exists() && existingSnap.data().status === "pending")
        throw new Error("Ya existe una solicitud pendiente para este jugador y equipo.");
      const recipientId = type === "team_invitation" ? playerId : team.adminId;
      tx.set(requestRef, {
        type, teamId, playerId, senderId: uid, recipientId,
        status: "pending", createdAt: Date.now(), updatedAt: Date.now()
      });
      tx.set(notificationRef, {
        userId: recipientId,
        type: "transfer_request",
        title: type === "team_invitation" ? "Invitación a un equipo" : "Nuevo jugador interesado",
        message: type === "team_invitation" ? "Un equipo te invitó a sumarte." : "Un jugador quiere sumarse a tu equipo.",
        relatedId: requestId,
        read: false,
        createdAt: Date.now()
      });
    });
    return requestId;
  }
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