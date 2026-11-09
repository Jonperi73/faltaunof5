// Mercado de Pases — interfaz inicial conectada a Firestore.
let transferTab = "players";
let transferCache = [];

function transferEsc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[ch]);
}
function setTransferTab(tab, btn) {
  transferTab = tab;
  document.querySelectorAll("#s-transfers .tab").forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  renderTransferListings();
}
async function renderTransferListings() {
  const root = document.getElementById("transfer-listings");
  if (!root) return;
  root.innerHTML = '<div class="notice">⚽ Cargando publicaciones…</div>';
  try {
    if (transferTab === "requests") return renderTransferRequests(root);
    transferCache = await getActiveTransferListings();
    const uid = firebaseAuth.currentUser?.uid;
    const items = transferCache.filter(x => transferTab === "mine"
      ? x.ownerId === uid
      : x.kind === (transferTab === "players" ? "player" : "team"));
    if (!items.length) {
      root.innerHTML = '<div class="card transfer-empty"><div style="font-size:34px">⚽</div><h3>Todavía no hay publicaciones</h3><p>Cuando alguien publique que busca equipo o refuerzos, va a aparecer acá.</p><button class="btn btn-accent" onclick="openTransferPublish()">Crear publicación</button></div>';
      return;
    }
    root.innerHTML = items.map(item => {
      const isPlayer = item.kind === "player";
      const title = isPlayer ? (item.title || "Jugador") : (item.teamName || item.title || "Equipo");
      const subtitle = isPlayer ? (item.position || "Posición no indicada") :
        (Array.isArray(item.positionsNeeded) ? item.positionsNeeded.join(" · ") : "Busca refuerzos");
      return `<article class="card transfer-card">
        <div class="transfer-card-head"><span class="badge badge-public">${isPlayer ? "JUGADOR" : "EQUIPO"}</span><span class="transfer-zone">📍 ${transferEsc(item.zone || "Zona no indicada")}</span></div>
        <h3>${transferEsc(title)}</h3><div class="transfer-subtitle">${transferEsc(subtitle)}</div>
        <p>${transferEsc(item.description || (isPlayer ? "Está buscando sumarse a un equipo." : "Está buscando jugadores para su plantel."))}</p>
        ${!isPlayer && uid && item.ownerId !== uid ? `<button class="btn btn-accent" onclick="applyToTransferTeam('${transferEsc(item.teamId)}')">Me interesa</button>` : ""}
        ${isPlayer && uid && item.ownerId !== uid ? `<button class="btn btn-accent" onclick="invitePlayerToTeam('${transferEsc(item.playerId || item.ownerId)}')">Invitar al equipo</button>` : ""}
        ${isPlayer && item.ownerId === uid ? '<span class="transfer-own">Tu publicación</span>' : ""}
      </article>`;
    }).join("");
  } catch (error) {
    console.error(error);
    root.innerHTML = '<div class="notice">No se pudieron cargar las publicaciones. Revisá tu conexión e intentá nuevamente.</div>';
  }
}
async function openTransferPublish() {
  if (!firebaseAuth.currentUser) return alert("Iniciá sesión para publicar.");
  const choice = prompt("¿Qué querés publicar?\n1 - Busco equipo (jugador)\n2 - Mi equipo busca refuerzos");
  if (choice === "1") {
    const user = users[currentUser] || {};
    const title = prompt("Título de tu publicación:", user.name || currentUser || "");
    if (!title) return;
    const position = prompt("¿En qué posición jugás?", user.pos || "Cualquiera");
    const zone = prompt("¿En qué zona buscás equipo?", "La Plata");
    const description = prompt("Contá brevemente qué buscás (opcional):", "");
    try {
      await savePublicPlayerProfile({username:currentUser,name:user.name || title,position,zone,description,lookingForTeam:true});
      await createTransferListing({kind:"player",title,position,zone,description});
      alert("¡Publicación creada!");
      transferTab = "players";
      document.querySelectorAll("#s-transfers .tab").forEach((x,i)=>x.classList.toggle("active",i===0));
      renderTransferListings();
    } catch(e) { alert(e.message || "No se pudo publicar."); }
  } else if (choice === "2") {
    try {
      const teams = await getActiveTeams();
      const mine = teams.filter(t => t.adminId === firebaseAuth.currentUser.uid || t.captainId === firebaseAuth.currentUser.uid);
      if (!mine.length) {
        const teamName = prompt("Todavía no tenés equipo. ¿Cómo se va a llamar?");
        if (!teamName) return;
        const zone = prompt("¿De qué zona es el equipo?", "La Plata");
        const description = prompt("Descripción del equipo (opcional):", "");
        await createPermanentTeam({name:teamName,zone,description});
        alert("¡Equipo creado! Ahora publicá la búsqueda de refuerzos.");
        return openTransferPublish();
      }
      const options = mine.map((t,i)=>`${i+1} - ${t.name}`).join("\n");
      const selected = Number(prompt("Elegí el equipo:\n"+options));
      if (!selected || !mine[selected-1]) return;
      const team = mine[selected-1];
      const positions = prompt("¿Qué posiciones necesitás? (separadas por coma)", "Arquero, Defensor, Volante, Delantero");
      const count = Number(prompt("¿Cuántos jugadores necesitás?", "1")) || 1;
      const description = prompt("Descripción (opcional):", "");
      await createTransferListing({kind:"team",teamId:team.id,title:team.name,zone:team.zone,description,positionsNeeded:positions.split(",").map(x=>x.trim()).filter(Boolean),playersNeeded:count});
      alert("¡Búsqueda de refuerzos publicada!");
      transferTab = "teams";
      document.querySelectorAll("#s-transfers .tab").forEach((x,i)=>x.classList.toggle("active",i===1));
      renderTransferListings();
    } catch(e) { alert(e.message || "No se pudo publicar."); }
  }
}
async function applyToTransferTeam(teamId) {
  if (!teamId || !firebaseAuth.currentUser) return;
  try {
    const user = users[currentUser] || {};
    await savePublicPlayerProfile({
      username: currentUser,
      name: user.name || currentUser,
      position: user.pos || "Cualquiera",
      zone: user.zone || "",
      description: user.description || "",
      lookingForTeam: true
    });
    await sendTransferRequest({type:"player_application",teamId,playerId:firebaseAuth.currentUser.uid});
    alert("¡Listo! El equipo recibió tu interés.");
  } catch(e) { alert(e.message || "No se pudo enviar la solicitud."); }
}

async function invitePlayerToTeam(playerId) {
  try {
    const teams = await getActiveTeams();
    const mine = teams.filter(t => t.adminId === firebaseAuth.currentUser?.uid || t.captainId === firebaseAuth.currentUser?.uid);
    if (!mine.length) return alert("Necesitás ser administrador o capitán de un equipo para invitar jugadores.");
    const options = mine.map((t,i)=>`${i+1} - ${t.name}`).join("\n");
    const selected = Number(prompt("¿Desde qué equipo querés enviar la invitación?\\n"+options));
    if (!selected || !mine[selected-1]) return;
    await sendTransferRequest({type:"team_invitation",teamId:mine[selected-1].id,playerId});
    alert("¡Invitación enviada!");
  } catch(e) { alert(e.message || "No se pudo enviar la invitación."); }
}

async function renderTransferRequests(root) {
  try {
    const [requests, teams, profiles, notifications, myTeams] = await Promise.all([
      getMyTransferRequests(), getActiveTeams(), getPublicPlayerProfiles(), getMyNotifications(), getMyTeams()
    ]);
    const uid = firebaseAuth.currentUser?.uid;
    const teamMap = new Map(teams.map(t=>[t.id,t]));
    const profileMap = new Map(profiles.map(p=>[p.id,p]));
    const unread = notifications.filter(n=>!n.read);
    const notificationHtml = unread.length ? `<div class="card transfer-notice"><strong>🔔 ${unread.length} notificación(es) sin leer</strong>${unread.slice(0,4).map(n=>`<div class="transfer-notification"><span>${transferEsc(n.title || "Aviso")}</span><button class="btn btn-outline btn-sm" onclick="readTransferNotification('${transferEsc(n.id)}')">Marcar leída</button></div>`).join("")}</div>` : "";
    if (!requests.length) {
      root.innerHTML = notificationHtml + '<div class="card transfer-empty"><div style="font-size:34px">📬</div><h3>No tenés solicitudes todavía</h3><p>Cuando un equipo te invite o alguien se interese por tu equipo, vas a verlo acá.</p></div>';
      return;
    }
    const cards = requests.map(r=>{
      const team = teamMap.get(r.teamId) || {};
      const player = profileMap.get(r.playerId) || {};
      const received = r.recipientId === uid;
      const title = r.type === "team_invitation" ? (team.name || "Invitación a un equipo") : (player.name || player.username || "Jugador interesado");
      const detail = r.type === "team_invitation" ? "Te invitaron a sumarte a este equipo." : "Este jugador quiere sumarse a tu plantel.";
      const status = r.status === "pending" ? "Pendiente" : r.status === "accepted" ? "Aceptada" : r.status === "rejected" ? "Rechazada" : r.status;
      const actions = received && r.status === "pending" ? `<div class="transfer-actions"><button class="btn btn-accent" onclick="answerTransferRequest('${transferEsc(r.id)}','accepted')">Aceptar</button><button class="btn btn-outline" onclick="answerTransferRequest('${transferEsc(r.id)}','rejected')">Rechazar</button></div>` : "";
      return `<article class="card transfer-card"><div class="transfer-card-head"><span class="badge badge-public">${received ? "RECIBIDA" : "ENVIADA"}</span><span class="transfer-zone">${transferEsc(status)}</span></div><h3>${transferEsc(title)}</h3><p>${transferEsc(detail)}</p><div class="transfer-subtitle">Equipo: ${transferEsc(team.name || "No disponible")}</div>${actions}</article>`;
    }).join("");
    const rosterHtml = await Promise.all(myTeams.map(async team => {
      const members = await getTeamMembers(team.id);
      const roster = members.filter(m=>m.status === "active").map(m=>{
        const p = profileMap.get(m.userId) || {};
        return `<div class="transfer-roster-member"><span>${transferEsc(p.name || p.username || m.userId.slice(0,8))}</span><small>${transferEsc(m.role || "member")}</small></div>`;
      }).join("");
      return `<section class="card transfer-team-roster"><div class="transfer-card-head"><strong>${transferEsc(team.name)}</strong><span class="badge badge-public">${team.teamType === "casual" ? "CASUAL" : "PERMANENTE"}</span></div><div class="transfer-subtitle">${members.filter(m=>m.status === "active").length} integrante(s) · Tu rol: ${transferEsc(team.myRole || "integrante")}</div>${roster || '<p class="transfer-subtitle">Todavía no hay integrantes.</p>'}</section>`;
    })).then(items=>items.join(""));
    root.innerHTML = notificationHtml + (myTeams.length ? '<h3 class="transfer-section-title">Mis equipos y planteles</h3>' + rosterHtml : '') + cards;
  } catch(e) {
    console.error(e);
    root.innerHTML = '<div class="notice">No se pudieron cargar las solicitudes. Verificá las reglas de Firestore y volvé a intentar.</div>';
  }
}
async function answerTransferRequest(id, decision) {
  const verb = decision === "accepted" ? "aceptar" : "rechazar";
  if (!confirm("¿Querés "+verb+" esta solicitud?")) return;
  try {
    await respondTransferRequest(id, decision);
    alert(decision === "accepted" ? "¡Solicitud aceptada! El jugador ya forma parte del equipo." : "Solicitud rechazada.");
    renderTransferListings();
  } catch(e) { alert(e.message || "No se pudo responder la solicitud."); }
}
async function readTransferNotification(id) {
  try { await markNotificationRead(id); renderTransferListings(); }
  catch(e) { alert(e.message || "No se pudo actualizar la notificación."); }
}
