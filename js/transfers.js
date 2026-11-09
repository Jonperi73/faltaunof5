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
    await sendTransferRequest({type:"player_application",teamId,playerId:firebaseAuth.currentUser.uid});
    alert("¡Listo! El equipo recibió tu interés.");
  } catch(e) { alert(e.message || "No se pudo enviar la solicitud."); }
}

async function invitePlayerToTeam(playerId) {
  try {
    const teams = await getActiveTeams();
    const mine = teams.filter(t => t.adminId === firebaseAuth.currentUser?.uid || t.captainId === firebaseAuth.currentUser?.uid);
    if (!mine.length) return alert("Necesitás ser administrador o capitán de un equipo para invitar jugadores.");
    const options = mine.map((t,i)=>`${i+1} - ${t.name}`).join("\\n");
    const selected = Number(prompt("¿Desde qué equipo querés enviar la invitación?\\n"+options));
    if (!selected || !mine[selected-1]) return;
    await sendTransferRequest({type:"team_invitation",teamId:mine[selected-1].id,playerId});
    alert("¡Invitación enviada!");
  } catch(e) { alert(e.message || "No se pudo enviar la invitación."); }
}
