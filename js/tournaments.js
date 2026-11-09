// ============================================================
// TORNEOS - Firestore + búsqueda de jugadores registrados
// ============================================================
let tournamentCache = [];
let tournamentUsers = [];
const TOURNAMENT_KEY = "tournaments";

function tournamentEsc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function tournamentFormatName(format) {
  return format === "knockout" ? "Eliminación directa" : "Todos contra todos";
}
async function refreshTournamentData() {
  tournamentCache = await getFirestoreTournaments();
  return tournamentCache;
}
async function renderTournaments() {
  const host = document.getElementById("tournaments-content");
  if (!host) return;
  host.innerHTML = '<div class="notice">Cargando torneos…</div>';
  try {
    const items = await refreshTournamentData();
    if (!items.length) {
      host.innerHTML = '<div class="notice">🏆 Todavía no hay torneos. Creá uno para empezar.</div>';
      return;
    }
    host.innerHTML = items.slice().reverse().map(t => `
      <div class="card tournament-card">
        <div class="tournament-card-head">
          <div><div class="tournament-name">${tournamentEsc(t.name)}</div><div class="tournament-meta">${tournamentFormatName(t.format)} · ${t.teams.length} equipos</div></div>
          <span class="badge ${t.started ? "badge-done" : "badge-open"}">${t.started ? "En juego" : "Inscripción"}</span>
        </div>
        ${t.description ? '<p class="tournament-meta">' + tournamentEsc(t.description) + '</p>' : ""}
        <button class="btn btn-outline btn-sm" onclick="openTournament('${t.id}')">Ver torneo</button>
      </div>`).join("");
  } catch (error) {
    console.error(error);
    host.innerHTML = '<div class="notice">No se pudieron cargar los torneos de Firebase. Revisá las reglas de Firestore.</div>';
  }
}
function showTournamentCreate() {
  const host = document.getElementById("tournaments-content");
  host.innerHTML = `
    <div class="card">
      <div class="modal-title">Crear torneo</div>
      <div class="field"><label>Nombre</label><input id="tr-name" maxlength="60" placeholder="Ej. Copa de los miércoles"></div>
      <div class="field"><label>Formato</label><select id="tr-format"><option value="roundrobin">Todos contra todos</option><option value="knockout">Eliminación directa</option></select></div>
      <div class="field"><label>Descripción (opcional)</label><textarea id="tr-description" placeholder="Reglas o información del torneo"></textarea></div>
      <button class="btn btn-accent" onclick="createTournament()">Crear torneo</button>
      <button class="btn btn-outline" style="margin-top:8px" onclick="renderTournaments()">Cancelar</button>
    </div>`;
}
async function createTournament() {
  const name = document.getElementById("tr-name").value.trim();
  const format = document.getElementById("tr-format").value;
  const description = document.getElementById("tr-description").value.trim();
  if (!name) return alert("Ingresá el nombre del torneo.");
  const id = "tr_" + Date.now();
  const t = { id, name, format, description, owner: currentUser, teams: [], matches: [], started: false, created: Date.now() };
  try {
    await createFirestoreTournament(t);
    await openTournament(id);
  } catch (error) {
    console.error(error);
    alert("No se pudo crear el torneo en Firebase: " + error.message);
  }
}
async function loadTournamentPlayers() {
  tournamentUsers = (await listFirestoreUsers()).filter(u => u.username && u.accountType === "jugador");
  return tournamentUsers;
}
async function openTournament(id) {
  const host = document.getElementById("tournaments-content");
  if (!host) return;
  host.innerHTML = '<div class="notice">Cargando torneo…</div>';
  try {
    const all = await refreshTournamentData();
    const t = all.find(x => x.id === id);
    if (!t) return renderTournaments();
    if (!t.started) await loadTournamentPlayers();
    const selected = new Set();
    const playerOptions = tournamentUsers.map(u => { const occupiedBy = t.teams.find(team => [...team.players, ...team.substitutes].includes(u.username)); const status = occupiedBy ? " · NO DISPONIBLE: " + occupiedBy.name : " · Disponible"; return `<option value="${tournamentEsc(u.username)}">${tournamentEsc(u.name || u.username)} (@${tournamentEsc(u.username)})${tournamentEsc(status)}</option>`; }).join("");
    const teamCards = t.teams.map((team, i) => `
      <div class="tournament-team">
        <strong>${i + 1}. ${tournamentEsc(team.name)}</strong>
        <div class="tournament-meta">Titulares: ${team.players.map(tournamentEsc).join(", ")}</div>
        <div class="tournament-meta">Suplentes: ${team.substitutes.length ? team.substitutes.map(tournamentEsc).join(", ") : "Ninguno"}</div>
      </div>`).join("") || '<div class="notice">Todavía no hay equipos inscriptos.</div>';
    const matches = t.matches.length ? `<div class="divider"></div><h3>Fixture</h3>${t.matches.map(m => {
      const a = t.teams.find(x => x.id === m.a), b = t.teams.find(x => x.id === m.b);
      return '<div class="tournament-match"><span>' + tournamentEsc(m.label) + '</span><strong>' + tournamentEsc(a?.name || "Libre") + ' vs ' + tournamentEsc(b?.name || "Libre") + '</strong></div>';
    }).join("")}` : "";
    host.innerHTML = `
      <div class="card">
        <div class="tournament-card-head"><div><div class="tournament-name">${tournamentEsc(t.name)}</div><div class="tournament-meta">${tournamentFormatName(t.format)}</div></div><span class="badge ${t.started ? "badge-done" : "badge-open"}">${t.started ? "En juego" : "Inscripción abierta"}</span></div>
        ${t.description ? '<p class="tournament-meta">' + tournamentEsc(t.description) + '</p>' : ""}
        <div class="stats-grid"><div class="stat-box"><div class="stat-val">${t.teams.length}</div><div class="stat-lbl">Equipos</div></div><div class="stat-box"><div class="stat-val">${t.teams.reduce((n, x) => n + x.players.length, 0)}</div><div class="stat-lbl">Titulares</div></div><div class="stat-box"><div class="stat-val">${t.teams.reduce((n, x) => n + x.substitutes.length, 0)}</div><div class="stat-lbl">Suplentes</div></div></div>
        ${!t.started ? `
          <div class="divider"></div><h3>Inscribir equipo</h3>
          <div class="field"><label>Nombre del equipo</label><input id="tr-team-name" maxlength="40" placeholder="Nombre del equipo"></div>
          <div class="field"><label>Buscar jugador registrado</label><input id="tr-player-search" list="tr-player-list" placeholder="Nombre o alias"><datalist id="tr-player-list">${playerOptions}</datalist></div>
          <button class="btn btn-outline btn-sm" onclick="addTournamentPlayer('players')">Agregar titular</button>
          <div id="tr-selected-players" class="tournament-meta">Titulares seleccionados: 0/5</div>
          <div class="field"><label>Buscar suplente (opcional)</label><input id="tr-sub-search" list="tr-player-list" placeholder="Nombre o alias"></div>
          <button class="btn btn-outline btn-sm" onclick="addTournamentPlayer('substitutes')">Agregar suplente</button>
          <div id="tr-selected-subs" class="tournament-meta">Suplentes seleccionados: 0/4</div>
          <div class="notice">Solo aparecen cuentas de jugadores registradas. Cada usuario puede estar en un solo equipo de este torneo, pero participar en otros torneos.</div>
          <button class="btn btn-accent" style="margin-top:12px" onclick="registerTournamentTeam('${t.id}')">Inscribir equipo</button>
          <button class="btn btn-outline" style="margin-top:8px" onclick="startTournament('${t.id}')">Generar fixture y comenzar</button>` : ""}
        <div class="divider"></div><h3>Equipos inscriptos</h3>${teamCards}${matches}
        <button class="btn btn-outline" style="margin-top:14px" onclick="renderTournaments()">Volver a torneos</button>
      </div>`;
    window.tournamentSelection = { players: [], substitutes: [] };
  } catch (error) {
    console.error(error);
    host.innerHTML = '<div class="notice">No se pudo abrir el torneo: ' + tournamentEsc(error.message) + '</div>';
  }
}
function addTournamentPlayer(kind) {
  const input = document.getElementById(kind === "players" ? "tr-player-search" : "tr-sub-search");
  const username = input.value.trim().replace(/^@/, "").toLowerCase();
  const user = tournamentUsers.find(u => u.username.toLowerCase() === username || (u.name || "").toLowerCase() === input.value.trim().toLowerCase());
  if (!user) return alert("Elegí un jugador de las cuentas registradas.");
  const selection = window.tournamentSelection;
  const roster = [...selection.players, ...selection.substitutes];
  if (roster.includes(user.username)) return alert("Ese jugador ya está seleccionado en este equipo.");
  const max = kind === "players" ? 5 : 4;
  if (selection[kind].length >= max) return alert("Ya alcanzaste el máximo permitido.");
  const tournament = tournamentCache.find(t => t.id === document.querySelector('[onclick*="registerTournamentTeam"]')?.getAttribute("onclick")?.match(/'([^']+)'/)?.[1]);
  const occupied = tournament?.teams.find(team => [...team.players, ...team.substitutes].includes(user.username));
  if (occupied) return alert(user.username + " ya está inscripto en " + occupied.name + " en este torneo.");
  selection[kind].push(user.username);
  input.value = "";
  document.getElementById("tr-selected-" + (kind === "players" ? "players" : "subs")).innerHTML =
    (kind === "players" ? "Titulares" : "Suplentes") + ": " + selection[kind].map(tournamentEsc).join(", ") + " (" + selection[kind].length + "/" + max + ")";
}
async function registerTournamentTeam(id) {
  const t = tournamentCache.find(x => x.id === id);
  const name = document.getElementById("tr-team-name").value.trim();
  const { players, substitutes } = window.tournamentSelection || { players: [], substitutes: [] };
  if (!name) return alert("Ingresá el nombre del equipo.");
  if (players.length !== 5) return alert("Cada equipo debe tener exactamente 5 titulares.");
  if (substitutes.length > 4) return alert("Se permiten hasta 4 suplentes.");
  if (t?.teams.some(team => team.name.toLowerCase() === name.toLowerCase())) return alert("Ya existe un equipo con ese nombre.");
  const team = { id: "team_" + Date.now(), name, players, substitutes, registered: Date.now() };
  try {
    await registerFirestoreTeam(id, team);
    await openTournament(id);
  } catch (error) {
    console.error(error);
    alert(error.message || "No se pudo inscribir el equipo.");
  }
}
async function startTournament(id) {
  const t = tournamentCache.find(x => x.id === id);
  if (!t || t.started) return;
  if (t.teams.length < 2) return alert("Necesitás al menos 2 equipos para comenzar.");
  const matches = t.format === "knockout" ? buildKnockout(t.teams) : buildRoundRobin(t.teams);
  try {
    await startFirestoreTournament(id, matches);
    await openTournament(id);
  } catch (error) {
    console.error(error);
    alert(error.message || "No se pudo iniciar el torneo.");
  }
}
function buildRoundRobin(teams) {
  const list = teams.map(x => x.id);
  if (list.length % 2) list.push(null);
  const n = list.length, rounds = [];
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = list[i], b = list[n - 1 - i];
      if (a && b) rounds.push({ a, b, label: "Fecha " + (r + 1) });
    }
    list.splice(1, 0, list.pop());
  }
  return rounds;
}
function buildKnockout(teams) {
  const ids = teams.map(x => x.id);
  const size = 2 ** Math.ceil(Math.log2(ids.length));
  const slots = ids.concat(Array(size - ids.length).fill(null));
  const games = [];
  for (let i = 0; i < size; i += 2) if (slots[i] && slots[i + 1]) games.push({ a: slots[i], b: slots[i + 1], label: "Ronda inicial" });
  return games;
}
console.log("TOURNAMENTS MODULE OK");