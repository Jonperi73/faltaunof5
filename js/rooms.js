//  ROOM LIST
// ============================================================
function renderHome(){
  const pub=rooms.filter(r=>!r.isPrivate);
  const priv=rooms.filter(r=>r.isPrivate&&(r.owner===currentUser||r.players.includes(currentUser)));
  const mis=rooms.filter(r=>r.owner===currentUser||r.players.includes(currentUser));
  renderRoomList('tab-home-publicas',pub);
  renderRoomList('tab-home-privadas-list',priv);
  renderRoomList('tab-home-mis',mis);
}
function renderRoomList(containerId,list){
  const el=document.getElementById(containerId);if(!el)return;
  if(!list.length){el.innerHTML=`<div style="text-align:center;padding:2rem;color:var(--text2);font-size:14px">No hay salas por acá.</div>`;return;}
  el.innerHTML=list.map(r=>{
    const joined=r.players.includes(currentUser);
    const full=r.players.length>=r.max;
    const isOver=r.result!==null;
    const avs=r.players.slice(0,5).map((p,i)=>buildAvatar(p,'sm',`margin-left:${i===0?0:-8}px;border:2px solid var(--card);`)).join('');
    const yesCount=Object.values(r.confirm||{}).filter(v=>v==='yes').length;
    const countdown=getCountdown(r.date,r.time);
    const ownerUser=users[r.owner];
    const ownerVerified=isVenueVerified(r.owner);
    return`<div class="room-card" onclick="openRoom(${r.id})">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div class="room-card-title">${r.name}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;flex-shrink:0;margin-left:8px">
          ${r.isPrivate?'<span class="badge badge-private">🔒</span>':'<span class="badge badge-public">🌐</span>'}
          ${ownerVerified?'<span class="badge badge-verified">✓ Verificada</span>':''}
          ${isOver?'<span class="badge badge-done">Final</span>':full?'<span class="badge badge-full">Lleno</span>':'<span class="badge badge-open">'+r.players.length+'/'+r.max+'</span>'}
        </div>
      </div>
      <div class="room-card-meta">
        <span>📍 ${r.venue}</span>
        <span>📅 ${fmtDate(r.date,r.time)}hs</span>
        ${r.cost?`<span>💲${r.cost.toLocaleString()}</span>`:'<span>🆓 Gratis</span>'}
        ${yesCount?`<span>✅ ${yesCount} confirmados</span>`:''}
        ${countdown&&!isOver?`<span class="countdown-chip ${countdown.type==='soon'?'soon':countdown.type==='past'?'past':''}">⏱ ${countdown.label}</span>`:''}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center">${avs}${r.players.length>5?`<div style="margin-left:4px;font-size:11px;color:var(--text2)">+${r.players.length-5}</div>`:''}</div>
        ${joined?'<span style="font-size:12px;color:var(--accent);font-weight:600">✓ Anotado</span>':''}
      </div>
    </div>`;
  }).join('');
}

// ============================================================
//  CREATE ROOM
// ============================================================
function createRoom(){
  if(!currentUser)return;
  const name=document.getElementById('c-name').value.trim();
  const venue=document.getElementById('c-venue').value.trim();
  if(!name||!venue)return alert('Completá nombre y cancha.');
  const today=new Date().toISOString().split('T')[0];
  const selectedDate=document.getElementById('c-date').value;
  if(selectedDate&&selectedDate<today)return alert('La fecha no puede ser en el pasado.');
  const r={
    id:nextRoomId++,name,venue,
    address:document.getElementById('c-address').value.trim(),
    date:selectedDate,
    time:document.getElementById('c-time').value,
    max:parseInt(document.getElementById('c-max').value),
    cost:parseInt(document.getElementById('c-cost').value)||0,
    desc:document.getElementById('c-desc').value.trim(),
    isPrivate:document.getElementById('c-private').checked,
    code:document.getElementById('c-private').checked?rndCode():'PUBLIC',
    owner:currentUser,
    ownerIsVenue:isVenueOwner(),
    players:isVenueOwner()?[]:[currentUser],
    lates:{},goals:{},result:null,mvpVotes:{},mvpWinner:null,
    confirm:{},payments:{},chat:[],playerStatus:{},positions:{},pitchLocked:false,
    created:Date.now(),finished:false
  };
  rooms.push(r);save('rooms',rooms);save('nextRoomId',nextRoomId);
  ['c-name','c-venue','c-address','c-date','c-time','c-cost','c-desc'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('c-private').checked=false;
  openRoom(r.id);
}

// ============================================================

// ============================================================
//  ROOM MEMBERSHIP
// ============================================================
function joinRoom(id){
  const room=rooms.find(r=>r.id===id);const u=currentUser;
  if(!room||room.players.includes(u)||room.players.length>=room.max)return;
  room.players.push(u);save('rooms',rooms);renderDetailInfo(room);
}
function leaveRoom(id){
  if(!confirm('¿Seguro que querés salir del partido?'))return;
  const room=rooms.find(r=>r.id===id);
  if(!room)return;
  room.players=room.players.filter(p=>p!==currentUser);
  if(room.teamA)room.teamA=room.teamA.filter(p=>p!==currentUser);
  if(room.teamB)room.teamB=room.teamB.filter(p=>p!==currentUser);
  delete(room.confirm||{})[currentUser];
  delete(room.positions||{})[currentUser];
  save('rooms',rooms);renderDetailInfo(room);
}
function kickPlayer(id,player){
  if(!confirm('¿Querés sacar a este jugador?'))return;
  const room=rooms.find(r=>r.id===id);if(!room||room.owner!==currentUser)return;
  room.players=room.players.filter(p=>p!==player);
  if(room.teamA)room.teamA=room.teamA.filter(p=>p!==player);
  if(room.teamB)room.teamB=room.teamB.filter(p=>p!==player);
  delete(room.positions||{})[player];
  save('rooms',rooms);renderDetailInfo(room);
}
function joinPrivate(){
  const code=document.getElementById('priv-code-input').value.trim().toUpperCase();
  const room=rooms.find(r=>r.code===code);
  if(!room)return alert('No se encontró ninguna sala con ese código.');
  openRoom(room.id);
}

//  SHARE
// ============================================================
function shareRoom(){
  const room=rooms.find(r=>r.id===activeRoomId);if(!room)return;
  const yesCount=Object.values(room.confirm||{}).filter(v=>v==='yes').length;
  const ownerVerified=isVenueVerified(room.owner);
  const text=`⚽ *${room.name}*${ownerVerified?' ✓':''}\n📍 ${room.venue}${room.address?' — '+room.address:''}\n📅 ${fmtDate(room.date,room.time)}hs\n👥 ${room.players.length}/${room.max} jugadores${yesCount?` (${yesCount} confirmados)`:''}\n${room.cost?`💲 $${room.cost.toLocaleString()}/jugador`:''}\n${room.isPrivate?`🔒 Código: ${room.code}\n`:''}\nAnotate en Fulbito 5! 🏃‍♂️`;
  if(navigator.share){navigator.share({title:'Fulbito 5',text});}
  else if(navigator.clipboard){navigator.clipboard.writeText(text).then(()=>alert('¡Copiado al portapapeles! Pegalo en WhatsApp ✓'));}
  else{alert(text);}
}

// ============================================================
