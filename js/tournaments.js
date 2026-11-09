// ============================================================
// TORNEOS - Fulbito 5
// Persistencia local siguiendo el almacenamiento actual de la app.
// ============================================================
const TOURNAMENT_KEY = 'tournaments';

function tournamentData(){ return load(TOURNAMENT_KEY, []); }
function saveTournamentData(items){ save(TOURNAMENT_KEY, items); }
function tournamentEsc(value){
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function tournamentFormatName(format){
  return format === 'knockout' ? 'Eliminación directa' : 'Todos contra todos';
}
function renderTournaments(){
  const host=document.getElementById('tournaments-content');
  if(!host) return;
  const items=tournamentData();
  if(!items.length){
    host.innerHTML='<div class="notice">🏆 Todavía no hay torneos. Creá uno para empezar.</div>';
    return;
  }
  host.innerHTML=items.slice().reverse().map(t=>`
    <div class="card tournament-card">
      <div class="tournament-card-head">
        <div><div class="tournament-name">${tournamentEsc(t.name)}</div><div class="tournament-meta">${tournamentFormatName(t.format)} · ${t.teams.length} equipos</div></div>
        <span class="badge ${t.started?'badge-done':'badge-open'}">${t.started?'En juego':'Inscripción'}</span>
      </div>
      ${t.description?'<p class="tournament-meta">'+tournamentEsc(t.description)+'</p>':''}
      <button class="btn btn-outline btn-sm" onclick="openTournament('${t.id}')">Ver torneo</button>
    </div>`).join('');
}
function showTournamentCreate(){
  const host=document.getElementById('tournaments-content');
  host.innerHTML=`
    <div class="card">
      <div class="modal-title">Crear torneo</div>
      <div class="field"><label>Nombre</label><input id="tr-name" maxlength="60" placeholder="Ej. Copa de los miércoles"></div>
      <div class="field"><label>Formato</label><select id="tr-format"><option value="roundrobin">Todos contra todos</option><option value="knockout">Eliminación directa</option></select></div>
      <div class="field"><label>Descripción (opcional)</label><textarea id="tr-description" placeholder="Reglas o información del torneo"></textarea></div>
      <button class="btn btn-accent" onclick="createTournament()">Crear torneo</button>
      <button class="btn btn-outline" style="margin-top:8px" onclick="renderTournaments()">Cancelar</button>
    </div>`;
}
function createTournament(){
  const name=document.getElementById('tr-name').value.trim();
  const format=document.getElementById('tr-format').value;
  const description=document.getElementById('tr-description').value.trim();
  if(!name){alert('Ingresá el nombre del torneo.');return;}
  const items=tournamentData();
  const t={id:'tr_'+Date.now(),name,format,description,owner:currentUser?.username||null,teams:[],matches:[],started:false,created:Date.now()};
  items.push(t);saveTournamentData(items);openTournament(t.id);
}
function openTournament(id){
  const t=tournamentData().find(x=>x.id===id);
  const host=document.getElementById('tournaments-content');
  if(!t||!host)return;
  const teamCards=t.teams.map((team,i)=>`
    <div class="tournament-team">
      <strong>${i+1}. ${tournamentEsc(team.name)}</strong>
      <div class="tournament-meta">Titulares: ${team.players.map(tournamentEsc).join(', ')}</div>
      <div class="tournament-meta">Suplentes: ${team.substitutes.length?team.substitutes.map(tournamentEsc).join(', '):'Ninguno'}</div>
    </div>`).join('') || '<div class="notice">Todavía no hay equipos inscriptos.</div>';
  const matches=t.matches.length?`<div class="divider"></div><h3>Fixture</h3>${t.matches.map(m=>{
    const a=t.teams.find(x=>x.id===m.a),b=t.teams.find(x=>x.id===m.b);
    return '<div class="tournament-match"><span>'+tournamentEsc(m.label)+'</span><strong>'+tournamentEsc(a?.name||'Libre')+' vs '+tournamentEsc(b?.name||'Libre')+'</strong></div>';
  }).join('')}`:'';
  host.innerHTML=`
    <div class="card">
      <div class="tournament-card-head"><div><div class="tournament-name">${tournamentEsc(t.name)}</div><div class="tournament-meta">${tournamentFormatName(t.format)}</div></div><span class="badge ${t.started?'badge-done':'badge-open'}">${t.started?'En juego':'Inscripción abierta'}</span></div>
      ${t.description?'<p class="tournament-meta">'+tournamentEsc(t.description)+'</p>':''}
      <div class="stats-grid"><div class="stat-box"><div class="stat-val">${t.teams.length}</div><div class="stat-lbl">Equipos</div></div><div class="stat-box"><div class="stat-val">${t.teams.length*5}</div><div class="stat-lbl">Titulares</div></div><div class="stat-box"><div class="stat-val">${t.teams.reduce((n,x)=>n+x.substitutes.length,0)}</div><div class="stat-lbl">Suplentes</div></div></div>
      ${!t.started?`<div class="divider"></div><h3>Inscribir equipo</h3>
      <div class="field"><label>Nombre del equipo</label><input id="tr-team-name" maxlength="40" placeholder="Nombre del equipo"></div>
      <div class="field"><label>5 titulares (usuarios separados por coma)</label><input id="tr-team-players" placeholder="usuario1, usuario2, usuario3, usuario4, usuario5"></div>
      <div class="field"><label>Hasta 4 suplentes (opcional)</label><input id="tr-team-subs" placeholder="usuario6, usuario7"></div>
      <div class="notice">Usá los nombres de usuario registrados en Fulbito 5. El plantel queda fijo cuando comienza el torneo.</div>
      <button class="btn btn-accent" style="margin-top:12px" onclick="registerTournamentTeam('${t.id}')">Inscribir equipo</button>
      <button class="btn btn-outline" style="margin-top:8px" onclick="startTournament('${t.id}')">Generar fixture y comenzar</button>`:''}
      <div class="divider"></div><h3>Equipos inscriptos</h3>${teamCards}${matches}
      <button class="btn btn-outline" style="margin-top:14px" onclick="renderTournaments()">Volver a torneos</button>
    </div>`;
}
function parseRoster(input){
  return [...new Set(input.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean))];
}
function registerTournamentTeam(id){
  const items=tournamentData(),t=items.find(x=>x.id===id);
  if(!t||t.started)return;
  const name=document.getElementById('tr-team-name').value.trim();
  const players=parseRoster(document.getElementById('tr-team-players').value);
  const substitutes=parseRoster(document.getElementById('tr-team-subs').value);
  if(!name){alert('Ingresá el nombre del equipo.');return;}
  if(players.length!==5){alert('Cada equipo debe inscribir exactamente 5 titulares.');return;}
  if(substitutes.length>4){alert('Se permiten hasta 4 suplentes.');return;}
  if(players.some(x=>substitutes.includes(x))){alert('Un jugador no puede figurar como titular y suplente.');return;}
  const roster=[...players,...substitutes];
  const unknown=roster.filter(x=>!users[x]);
  if(unknown.length){alert('No existen estos usuarios: '+unknown.join(', '));return;}
  const already=t.teams.some(team=>[...team.players,...team.substitutes].some(x=>roster.includes(x)));
  if(already){alert('Un jugador ya está inscripto en otro equipo de este torneo.');return;}
  if(t.teams.some(team=>team.name.toLowerCase()===name.toLowerCase())){alert('Ya existe un equipo con ese nombre.');return;}
  t.teams.push({id:'team_'+Date.now(),name,players,substitutes,registered:Date.now()});
  saveTournamentData(items);openTournament(id);
}
function startTournament(id){
  const items=tournamentData(),t=items.find(x=>x.id===id);
  if(!t||t.started)return;
  if(t.teams.length<2){alert('Necesitás al menos 2 equipos para comenzar.');return;}
  t.matches=t.format==='knockout'?buildKnockout(t.teams):buildRoundRobin(t.teams);
  t.started=true;t.startedAt=Date.now();
  saveTournamentData(items);openTournament(id);
}
function buildRoundRobin(teams){
  const list=teams.map(x=>x.id);if(list.length%2)list.push(null);
  const n=list.length,rounds=[];
  for(let r=0;r<n-1;r++){
    const games=[];
    for(let i=0;i<n/2;i++){
      const a=list[i],b=list[n-1-i];
      if(a&&b)games.push({a,b,label:'Fecha '+(r+1)});
    }
    rounds.push(...games);list.splice(1,0,list.pop());
  }
  return rounds;
}
function buildKnockout(teams){
  const shuffled=teams.map(x=>x.id);
  const size=2**Math.ceil(Math.log2(shuffled.length));
  const slots=shuffled.concat(Array(size-shuffled.length).fill(null));
  const games=[];
  for(let i=0;i<size;i+=2){
    games.push({a:slots[i],b:slots[i+1],label:'Ronda inicial'});
  }
  return games.filter(x=>x.a&&x.b);
}
console.log('TOURNAMENTS MODULE OK');
