//  OPEN / RENDER DETAIL
// ============================================================
function openRoom(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  activeRoomId=id;
  document.getElementById('d-title').textContent=room.name;
  const histBtn=document.getElementById('tab-hist-btn');
  if(histBtn)histBtn.style.display=room.finished?'':'none';
  renderDetailInfo(room);
  document.getElementById('tab-detail-info').style.display='';
  document.getElementById('tab-detail-chat').style.display='none';
  document.getElementById('tab-detail-pagos').style.display='none';
  document.getElementById('tab-detail-historial').style.display='none';
  document.querySelectorAll('#detail-tabs .tab').forEach((t,i)=>{t.classList.toggle('active',i===0);});
  goTo('s-detail');
}

function renderDetailInfo(room){
  const isOwner=room.owner===currentUser;
  const inRoom=room.players.includes(currentUser);
  const full=room.players.length>=room.max;
  const isOver=room.result!==null;
  const myConfirm=(room.confirm||{})[currentUser]||'';
  const myStatus=(room.playerStatus||{})[currentUser]||'';
  const ownerUser=users[room.owner]||{name:room.owner};
  const ownerVerified=isVenueVerified(room.owner);
  const countdown=getCountdown(room.date,room.time);

  let html='';

  // Verified venue banner
  if(ownerVerified){
    html+=`<div class="venue-verified-banner">
      <span class="verified-check"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
      <div><div style="font-weight:700">Cancha Verificada</div><div style="font-size:11px;opacity:0.8">${ownerUser.venueName||room.venue} · ${ownerUser.venueAddr||room.address||''}</div></div>
    </div>`;
  }

  // Badges
  html+=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
    ${room.isPrivate?'<span class="badge badge-private">🔒 Privada</span>':'<span class="badge badge-public">🌐 Pública</span>'}
    ${isOver?'<span class="badge badge-done">Finalizado</span>':full?'<span class="badge badge-full">Completa</span>':'<span class="badge badge-open">'+room.players.length+'/'+room.max+'</span>'}
    ${countdown&&!isOver?`<span class="countdown-chip ${countdown.type==='soon'?'soon':countdown.type==='past'?'past':''}">⏱ ${countdown.label}</span>`:''}
  </div>`;

  // Stats
  html+=`<div class="stats-grid">
    <div class="stat-box"><div style="font-size:11px;color:var(--text2)">📅</div><div style="font-size:12px;font-weight:600;margin-top:3px">${fmtDate(room.date,room.time)}hs</div></div>
    <div class="stat-box"><div style="font-size:11px;color:var(--text2)">📍</div><div style="font-size:12px;font-weight:600;margin-top:3px">${room.venue}</div></div>
    <div class="stat-box"><div style="font-size:11px;color:var(--text2)">💲</div><div style="font-size:12px;font-weight:600;margin-top:3px">${room.cost?'$'+room.cost.toLocaleString():'Gratis'}</div></div>
  </div>`;

  if(room.desc)html+=`<div class="notice" style="margin-bottom:12px">📝 ${room.desc}</div>`;
  if(room.isPrivate&&isOwner)html+=`<div style="margin-bottom:12px"><div style="font-size:11px;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Código para compartir</div><div class="code-box">${room.code}</div></div>`;

  // PITCH — draggable
  const pitchContainerId=`pitch-drag-${room.id}`;
  const canDragSelf=inRoom&&!room.pitchLocked;
  html+=`<div style="margin:0 0 16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.06em;font-weight:600">Cancha</div>
      <div style="display:flex;gap:6px">
        ${isOwner&&!isOver?`<button class="btn btn-outline btn-sm" onclick="sortearEquipos(${room.id})" style="font-size:11px;padding:5px 10px">🎲 Sortear</button>`:''}
        ${isOwner?`<button class="btn ${room.pitchLocked?'btn-danger':'btn-outline'} btn-sm" onclick="togglePitchLock(${room.id})" style="font-size:11px;padding:5px 10px">${room.pitchLocked?'🔒 Bloqueado':'🔓 Libre'}</button>`:''}
        ${isOwner&&Object.keys(room.positions||{}).length?`<button class="btn btn-outline btn-sm" onclick="resetPositions(${room.id})" style="font-size:11px;padding:5px 10px">↺</button>`:''}
      </div>
    </div>
    ${room.pitchLocked&&!isOwner?`<div class="drag-locked-notice">🔒 El dueño bloqueó los movimientos</div>`:canDragSelf?`<div class="drag-hint">👆 Arrastrá tu ficha para posicionarte</div>`:''}
    <div id="${pitchContainerId}" style="border-radius:16px;overflow:hidden;border:1px solid var(--border)"></div>
  </div>`;

  // CONFIRM section
  if(inRoom&&!isOver){
    html+=`<div class="card" style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;margin-bottom:10px">¿Vas al partido?</div>
      <div class="confirm-row">
        <button class="cstate-btn ${myConfirm==='yes'?'active-yes':''}" onclick="setConfirm(${room.id},'yes',this)">✅ Voy seguro</button>
        <button class="cstate-btn ${myConfirm==='maybe'?'active-maybe':''}" onclick="setConfirm(${room.id},'maybe',this)">🤔 Puede ser</button>
        <button class="cstate-btn ${myConfirm==='no'?'active-no':''}" onclick="setConfirm(${room.id},'no',this)">❌ No puedo</button>
      </div>
    </div>`;
  }

  // QUICK STATUS
  if(inRoom&&!isOver){
    html+=`<div class="card" style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px">Mi estado${myStatus?` · <span style="color:var(--accent);font-size:12px">${myStatus}</span>`:''}</div>
      <div class="quick-msgs" id="qmsgs-${room.id}">
        ${QUICK_MESSAGES.map(m=>`<div class="qmsg ${myStatus===m.text?'selected':''}" style="${myStatus===m.text?'border-color:var(--accent);color:var(--accent)':''}" onclick="setStatus(${room.id},'${m.text.replace(/'/g,"\\'")}',this)">${m.text}</div>`).join('')}
      </div>
      ${myStatus?`<button class="btn btn-outline btn-sm" style="margin-top:6px" onclick="clearStatus(${room.id})">✕ Limpiar estado</button>`:''}
    </div>`;
  }

  // Players list
  html+=`<div style="margin-bottom:16px">
    <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.06em;font-weight:600;margin-bottom:8px">Jugadores (${room.players.length}/${room.max})</div>
    <div class="player-chips">`;
  room.players.forEach(p=>{
    const u=users[p]||{name:p,pos:'',photo:null};
    const lateCount=(room.lates||{})[p]||0;
    const goalCount=(room.goals||{})[p]||0;
    const isMe=p===currentUser;
    const conf=(room.confirm||{})[p]||'';
    const confIcon=conf==='yes'?'✅':conf==='maybe'?'🤔':conf==='no'?'❌':'';
    const pStatus=(room.playerStatus||{})[p]||'';
    html+=`<div class="player-chip" style="${isMe?'border-color:var(--accent)':''}">
      ${buildAvatar(p)}
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:600;display:flex;align-items:center;gap:4px">${u.name||p} ${isMe?'<span style="font-size:11px;color:var(--accent)">tú</span>':''} ${confIcon}</div>
        <div style="font-size:12px;color:var(--text2)">${u.pos||''}${pStatus?` · <span style="color:var(--accent)">${pStatus}</span>`:''}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
        ${lateCount?`<span style="font-size:12px;color:var(--danger)">⏰${lateCount}</span>`:''}
        ${goalCount?`<span style="font-size:12px;color:var(--accent)">⚽${goalCount}</span>`:''}
        ${(room.mvpWinner===p)?'<span style="font-size:14px" title="MVP">⭐</span>':''}
        ${isOwner&&!isOver&&p!==currentUser?`<button class="btn btn-danger btn-sm" onclick="kickPlayer(${room.id},'${p}')" style="padding:4px 8px;font-size:11px">✕</button>`:''}
      </div>
    </div>`;
  });
  for(let i=room.players.length;i<room.max;i++){
    html+=`<div style="padding:10px 12px;background:var(--card2);border-radius:10px;border:1px dashed var(--border);font-size:13px;color:var(--text2);display:flex;align-items:center;gap:8px">
      <div style="width:38px;height:38px;border-radius:50%;border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;font-size:18px">+</div>
      Lugar libre
    </div>`;
  }
  html+=`</div></div>`;

  // Action buttons
  if(!isOver){
    if(inRoom){
      html+=`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        <button class="btn btn-outline btn-sm" onclick="markLate(${room.id})">⏰ Llegué tarde</button>
        <button class="btn btn-danger btn-sm" onclick="leaveRoom(${room.id})">Salir</button>
        ${isOwner?`<button class="btn btn-outline btn-sm" onclick="openGoalForm(${room.id})">⚽ Goles</button>`:''}
        ${isOwner?`<button class="btn btn-accent btn-sm" onclick="openResultForm(${room.id})">🏆 Resultado</button>`:''}
      </div>`;
    } else if(!full&&!isVenueOwner()){
      html+=`<button class="btn btn-accent" style="margin-bottom:16px" onclick="joinRoom(${room.id})">+ Anotarme</button>`;
    } else if(full){
      html+=`<div class="notice" style="margin-bottom:16px">La sala está completa.</div>`;
    }
  }

  // MVP voting
  if(isOver&&inRoom&&!room.mvpWinner){
    html+=`<div class="card" style="margin-bottom:12px">
      <div style="font-size:14px;font-weight:600;margin-bottom:10px">⭐ Votá al MVP</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${room.players.filter(p=>p!==currentUser).map(p=>{
          const u=users[p]||{name:p};
          const alreadyVoted=(room.mvpVotes||{})[currentUser];
          return`<button class="btn btn-outline btn-sm" onclick="voteMVP(${room.id},'${p}')" style="${alreadyVoted===p?'border-color:var(--gold);color:var(--gold)':''}">
            ${buildAvatar(p,'sm','')} ${u.name}</button>`;
        }).join('')}
      </div>
    </div>`;
  }

  // Result display
  if(isOver){
    html+=`<div class="card" style="margin-bottom:12px">
      <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Resultado</div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="flex:1;text-align:center"><div style="font-size:10px;color:rgba(200,240,64,0.8);margin-bottom:4px">EQ. A</div><div style="font-size:48px;font-family:var(--font-black);color:var(--accent)">${room.result.a}</div></div>
        <div style="font-size:16px;color:var(--text2)">vs</div>
        <div style="flex:1;text-align:center"><div style="font-size:10px;color:rgba(255,96,96,0.8);margin-bottom:4px">EQ. B</div><div style="font-size:48px;font-family:var(--font-black);color:var(--danger)">${room.result.b}</div></div>
      </div>
      ${room.mvpWinner?`<div style="text-align:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)"><span style="font-size:12px;color:var(--text2)">MVP: </span><span style="font-weight:700;color:var(--gold)">⭐ ${(users[room.mvpWinner]||{name:room.mvpWinner}).name}</span></div>`:''}
    </div>`;
  }

  // Goal scorers
  const goalEntries=Object.entries(room.goals||{}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  if(goalEntries.length){
    html+=`<div class="card" style="margin-bottom:16px">
      <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Goleadores</div>
      ${goalEntries.map(([p,g])=>{const u=users[p]||{name:p};return`<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">${buildAvatar(p,'sm','')}<span style="flex:1;font-size:14px">${u.name||p}</span><span style="font-family:var(--font-black);font-size:18px;color:var(--accent)">⚽ ${g}</span></div>`;}).join('')}
    </div>`;
  }

  document.getElementById('tab-detail-info').innerHTML=html;

  // Build draggable pitch AFTER innerHTML is set
  requestAnimationFrame(()=>{
    buildDraggablePitch(room,pitchContainerId);
  });
}

// ============================================================

// ============================================================
//  ROOM DETAIL ACTIONS
// ============================================================
function markLate(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  if(!room.lates)room.lates={};
  room.lates[currentUser]=(room.lates[currentUser]||0)+1;
  setStatus(id,'⏰ Llegué tarde');
}
function setConfirm(id,val,btn){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  if(!room.confirm)room.confirm={};
  room.confirm[currentUser]=room.confirm[currentUser]===val?'':val;
  save('rooms',rooms);renderDetailInfo(room);
}
function setStatus(id,text,btnEl){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  if(!room.playerStatus)room.playerStatus={};
  room.playerStatus[currentUser]=text;
  postChatMsg(room,text,true);
  save('rooms',rooms);
  // Refresh pitch player node status bubble without full re-render
  const pitchContainerId=`pitch-drag-${room.id}`;
  buildDraggablePitch(room,pitchContainerId);
  // Also update the status in the quick msgs
  renderDetailInfo(room);
}
function clearStatus(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  if(room.playerStatus)delete room.playerStatus[currentUser];
  save('rooms',rooms);renderDetailInfo(room);
}
function voteMVP(id,player){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  if(!room.mvpVotes)room.mvpVotes={};
  room.mvpVotes[currentUser]=player;
  const tally={};Object.values(room.mvpVotes).forEach(v=>{tally[v]=(tally[v]||0)+1;});
  const winner=Object.entries(tally).sort((a,b)=>b[1]-a[1])[0];
  if(winner&&winner[1]>=Math.ceil(room.players.length/2))room.mvpWinner=winner[0];
  save('rooms',rooms);renderDetailInfo(room);
}
function sortearEquipos(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  const shuffled=[...room.players].sort(()=>Math.random()-0.5);
  const half=Math.ceil(room.max/2);
  room.teamA=shuffled.slice(0,half);
  room.teamB=shuffled.slice(half);
  room.positions={};// reset positions on new sort
  save('rooms',rooms);
  const pitchEl=document.getElementById(`pitch-drag-${id}`);
  if(pitchEl){pitchEl.style.opacity='0.5';pitchEl.style.transform='scale(0.98)';setTimeout(()=>{pitchEl.style.opacity='';pitchEl.style.transform='';renderDetailInfo(room);},600);}
  else renderDetailInfo(room);
}

// ============================================================
//  GOAL & RESULT MODALS
// ============================================================
function openGoalForm(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  openModal(`<div class="modal-title">⚽ Registrar goles</div>
    ${room.players.map(p=>{const u=users[p]||{name:p};return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">${buildAvatar(p,'sm','')}<span style="flex:1;font-size:14px">${u.name||p}</span><input type="number" min="0" max="20" value="${(room.goals||{})[p]||0}" data-player="${p}" style="width:52px;background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:6px;color:var(--text);text-align:center;font-family:var(--font-black);font-size:18px;outline:none"/></div>`;}).join('')}
    <button class="btn btn-accent" style="margin-top:12px" onclick="saveGoals(${id})">Guardar goles</button>`);
}
function saveGoals(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  if(!room.goals)room.goals={};
  document.querySelectorAll('#modal-body input[data-player]').forEach(inp=>{const v=parseInt(inp.value)||0;if(v>0)room.goals[inp.dataset.player]=v;else delete room.goals[inp.dataset.player];});
  save('rooms',rooms);closeModal();renderDetailInfo(room);
}
function openResultForm(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  openModal(`<div class="modal-title">🏆 Cargar resultado</div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
      <div style="flex:1;text-align:center"><div style="font-size:10px;color:rgba(200,240,64,0.8);margin-bottom:8px">EQUIPO A</div><input type="number" id="res-a" value="${room.result?room.result.a:0}" min="0" max="30" style="width:72px;background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:10px;color:var(--accent);text-align:center;font-family:var(--font-black);font-size:36px;outline:none"/></div>
      <div style="font-size:20px;color:var(--text2)">vs</div>
      <div style="flex:1;text-align:center"><div style="font-size:10px;color:rgba(255,96,96,0.8);margin-bottom:8px">EQUIPO B</div><input type="number" id="res-b" value="${room.result?room.result.b:0}" min="0" max="30" style="width:72px;background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:10px;color:var(--danger);text-align:center;font-family:var(--font-black);font-size:36px;outline:none"/></div>
    </div>
    <button class="btn btn-accent" onclick="saveResult(${id})">Guardar resultado</button>`);
}
function saveResult(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  room.result={a:parseInt(document.getElementById('res-a').value)||0,b:parseInt(document.getElementById('res-b').value)||0};
  room.finished=true;
  save('rooms',rooms);closeModal();renderDetailInfo(room);
  const histBtn=document.getElementById('tab-hist-btn');if(histBtn)histBtn.style.display='';
}

//  HISTORIAL
// ============================================================
function renderHistorial(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  const el=document.getElementById('tab-detail-historial');if(!el)return;
  const events=[];
  if(room.result)events.push({icon:'🏆',text:`Resultado: ${room.result.a} - ${room.result.b}`,ts:room.created+7200000});
  Object.entries(room.goals||{}).filter(([,v])=>v>0).forEach(([p,g])=>{const u=users[p]||{name:p};events.push({icon:'⚽',text:`${u.name} marcó ${g} gol${g>1?'es':''}`,ts:room.created+3600000});});
  Object.entries(room.lates||{}).filter(([,v])=>v>0).forEach(([p,v])=>{const u=users[p]||{name:p};events.push({icon:'⏰',text:`${u.name} llegó tarde ${v} vez${v>1?'es':''}`,ts:room.created+1800000});});
  if(room.mvpWinner){const u=users[room.mvpWinner]||{name:room.mvpWinner};events.push({icon:'⭐',text:`MVP: ${u.name}`,ts:room.created+7400000});}
  events.sort((a,b)=>b.ts-a.ts);
  el.innerHTML=`<div style="font-family:var(--font-black);font-size:16px;margin-bottom:14px">📋 Resumen del partido</div>
    <div class="stats-grid" style="margin-bottom:16px">
      <div class="stat-box"><div class="stat-val">${room.players.length}</div><div class="stat-lbl">Jugadores</div></div>
      <div class="stat-box"><div class="stat-val">${Object.values(room.goals||{}).reduce((a,b)=>a+b,0)}</div><div class="stat-lbl">Goles</div></div>
      <div class="stat-box"><div class="stat-val">${Object.values(room.lates||{}).reduce((a,b)=>a+b,0)}</div><div class="stat-lbl">Llegadas tarde</div></div>
    </div>
    ${events.length?events.map(e=>`<div class="hist-item"><div class="hist-dot" style="background:var(--accent)"></div><div><div style="font-size:14px">${e.icon} ${e.text}</div></div></div>`).join(''):'<div class="notice">Sin eventos registrados aún.</div>'}`;
}

// ============================================================
