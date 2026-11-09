import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, runTransaction, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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
const uidNow = () => auth.currentUser?.uid || null;
const clean = value => String(value ?? "").trim();

async function createTeam(team, teamType) {
  const uid = uidNow();
  if (!uid) throw new Error("Tenés que iniciar sesión.");
  const name = clean(team.name);
  if (!name) throw new Error("El equipo necesita un nombre.");
  const teamId = crypto.randomUUID();
  const teamRef = doc(db, "teams", teamId);
  const memberRef = doc(db, "teams", teamId, "members", uid);
  const now = Date.now();
  const payload = {
    name, description: clean(team.description), zone: clean(team.zone),
    teamType, createdBy: uid, adminId: uid, captainId: uid,
    status: "active", createdAt: now, updatedAt: now
  };
  await runTransaction(db, async tx => {
    tx.set(teamRef, payload);
    tx.set(memberRef, {
      userId: uid, role: teamType === "casual" ? "organizer" : "captain",
      status: "active", joinedAt: now
    });
  });
  return { id: teamId, ...payload };
}

async function sendTransferRequest(request) {
  const uid = uidNow();
  if (!uid) throw new Error("Tenés que iniciar sesión.");
  const type = request.type;
  if (!["team_invitation", "player_application"].includes(type))
    throw new Error("Tipo de solicitud inválido.");
  const teamId = clean(request.teamId);
  const playerId = clean(request.playerId);
  if (!teamId || !playerId) throw new Error("Faltan datos del equipo o jugador.");
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
    if (team.status !== "active") throw new Error("El equipo no está activo.");
    if (type === "player_application" && uid !== playerId)
      throw new Error("Solo podés postularte con tu propia cuenta.");
    if (type === "team_invitation" && team.adminId !== uid && team.captainId !== uid)
      throw new Error("No tenés permisos para invitar jugadores.");
    if (type === "team_invitation" && playerId === uid)
      throw new Error("No podés invitarte a vos mismo.");
    if (existingSnap.exists() && existingSnap.data().status === "pending")
      throw new Error("Ya existe una solicitud pendiente para este jugador y equipo.");
    const recipientId = type === "team_invitation" ? playerId : (team.adminId || team.captainId);
    const now = Date.now();
    tx.set(requestRef, {
      type, teamId, playerId, senderId: uid, recipientId,
      status: "pending", createdAt: now, updatedAt: now
    });
    tx.set(notificationRef, {
      userId: recipientId, type: "transfer_request",
      title: type === "team_invitation" ? "Invitación a un equipo" : "Nuevo jugador interesado",
      message: type === "team_invitation" ? "Un equipo te invitó a sumarte." : "Un jugador quiere sumarse a tu equipo.",
      relatedId: requestId, read: false, createdAt: now
    });
  });
  return requestId;
}

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
  }),

  savePublicPlayerProfile: async profile => {
    const uid = uidNow();
    if (!uid) throw new Error("Tenés que iniciar sesión.");
    const payload = {
      userId: uid,
      username: clean(profile.username).toLowerCase(),
      name: clean(profile.name),
      position: clean(profile.position) || "Cualquiera",
      zone: clean(profile.zone),
      description: clean(profile.description),
      lookingForTeam: Boolean(profile.lookingForTeam),
      status: "active", updatedAt: Date.now()
    };
    await setDoc(doc(db, "player_profiles", uid), payload, { merge: true });
    return payload;
  },
  getPublicPlayerProfiles: async () => {
    const snap = await getDocs(query(collection(db, "player_profiles"), where("status", "==", "active")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  createPermanentTeam: team => createTeam(team, "permanent"),
  createCasualTeam: team => createTeam(team, "casual"),
  getActiveTeams: async () => {
    const snap = await getDocs(query(collection(db, "teams"), where("status", "==", "active")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getMyTeams: async () => {
    const uid = uidNow();
    if (!uid) return [];
    const snap = await getDocs(query(collection(db, "teams"), where("adminId", "==", uid)));
    const captainSnap = await getDocs(query(collection(db, "teams"), where("captainId", "==", uid)));
    const all = new Map();
    [...snap.docs, ...captainSnap.docs].forEach(d => all.set(d.id, { id: d.id, ...d.data() }));
    return [...all.values()];
  },
  createTransferListing: async listing => {
    const uid = uidNow();
    if (!uid) throw new Error("Tenés que iniciar sesión.");
    const kind = listing.kind;
    if (!["player", "team"].includes(kind)) throw new Error("Tipo de publicación inválido.");
    const listingId = crypto.randomUUID();
    const payload = {
      kind, ownerId: uid, title: clean(listing.title),
      description: clean(listing.description), zone: clean(listing.zone),
      status: "active", createdAt: Date.now(), updatedAt: Date.now()
    };
    if (!payload.title) throw new Error("La publicación necesita un título.");
    if (kind === "player") {
      payload.position = clean(listing.position) || "Cualquiera";
      payload.playerId = uid;
    } else {
      const teamId = clean(listing.teamId);
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
    const constraints = [where("status", "==", "active")];
    if (kind) constraints.push(where("kind", "==", kind));
    const snap = await getDocs(query(collection(db, "transfer_listings"), ...constraints));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  sendTransferRequest,
  getMyTransferRequests: async () => {
    const uid = uidNow();
    if (!uid) return [];
    const a = await getDocs(query(collection(db, "transfer_requests"), where("recipientId", "==", uid)));
    const b = await getDocs(query(collection(db, "transfer_requests"), where("senderId", "==", uid)));
    const all = new Map();
    [...a.docs, ...b.docs].forEach(d => all.set(d.id, { id: d.id, ...d.data() }));
    return [...all.values()].sort((x,y) => (y.createdAt || 0) - (x.createdAt || 0));
  },
  getMyNotifications: async () => {
    const uid = uidNow();
    if (!uid) return [];
    const snap = await getDocs(query(collection(db, "notifications"), where("userId", "==", uid), orderBy("createdAt", "desc"), limit(50)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  respondTransferRequest: async (requestId, decision) => {
    const uid = uidNow();
    if (!uid) throw new Error("Tenés que iniciar sesión.");
    if (!["accepted", "rejected"].includes(decision)) throw new Error("Respuesta inválida.");
    const requestRef = doc(db, "transfer_requests", requestId);
    const notificationRef = doc(collection(db, "notifications"));
    await runTransaction(db, async tx => {
      const reqSnap = await tx.get(requestRef);
      if (!reqSnap.exists()) throw new Error("La solicitud ya no existe.");
      const req = reqSnap.data();
      if (req.status !== "pending") throw new Error("Esta solicitud ya fue respondida.");
      const teamRef = doc(db, "teams", req.teamId);
      const memberRef = doc(db, "teams", req.teamId, "members", req.playerId);
      const [teamSnap, memberSnap] = await Promise.all([tx.get(teamRef), tx.get(memberRef)]);
      if (!teamSnap.exists()) throw new Error("El equipo ya no existe.");
      const team = teamSnap.data();
      const isPlayerRecipient = req.type === "team_invitation" && req.recipientId === uid && req.playerId === uid;
      const isTeamManager = req.type === "player_application" && req.recipientId === uid &&
        (team.adminId === uid || team.captainId === uid);
      if (!isPlayerRecipient && !isTeamManager) throw new Error("No tenés permiso para responder esta solicitud.");
      if (decision === "accepted") {
        if (memberSnap.exists() && memberSnap.data().status === "active")
          throw new Error("El jugador ya forma parte de este equipo.");
        const now = Date.now();
        tx.set(memberRef, { userId: req.playerId, role: "member", status: "active", joinedAt: now, joinedFrom: req.type });
        tx.set(doc(collection(db, "team_membership_history")), {
          teamId: req.teamId, userId: req.playerId, action: "joined",
          source: req.type, requestId, performedBy: uid, createdAt: now
        });
      }
      tx.update(requestRef, { status: decision, respondedBy: uid, respondedAt: Date.now(), updatedAt: Date.now() });
      tx.set(notificationRef, {
        userId: req.senderId, type: "transfer_response",
        title: decision === "accepted" ? "Solicitud aceptada" : "Solicitud rechazada",
        message: decision === "accepted" ? "Tu solicitud fue aceptada y el jugador ya forma parte del equipo." : "Tu solicitud no fue aceptada.",
        relatedId: requestId, read: false, createdAt: Date.now()
      });
    });
    return true;
  },
  markNotificationRead: async notificationId => {
    const uid = uidNow();
    if (!uid) throw new Error("Tenés que iniciar sesión.");
    const ref = doc(db, "notifications", notificationId);
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().userId !== uid) throw new Error("Notificación no encontrada.");
      tx.update(ref, { read: true });
    });
  },
  getTeamMembers: async teamId => {
    const snap = await getDocs(collection(db, "teams", teamId, "members"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
});
console.log("Firebase conectado");
