//  PROFILE
// ============================================================
function renderProfile(){
  if(!currentUser)return;
  const u=users[currentUser];
  const stats=calcStats().find(s=>s.username===currentUser)||{points:0,wins:0,losses:0,draws:0,lates:0,goals:0,games:0,mvps:0};
  const myRooms=rooms.filter(r=>r.players.includes(currentUser)&&r.finished);
  const isCancha=u.accountType==='cancha';
  const adminUser=isAdmin();

  let html=`
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
      <div class="photo-upload" style="width:80px;height:80px;cursor:pointer" onclick="document.getElementById('edit-photo-input').click()">
        ${u.photo?`<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`:buildAvatar(currentUser,'xl','')}
        <div class="photo-overlay" style="border-radius:50%"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
      </div>
      <input type="file" id="edit-photo-input" accept="image/*" style="display:none" onchange="updateProfilePhoto(this)"/>
      <div>
        <div style="font-family:var(--font-black);font-size:22px;display:flex;align-items:center;gap:8px">
          ${u.name}
          ${isCancha&&u.venueVerified?`<span class="verified-check" title="Cancha verificada"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>`:''}
          ${isCancha&&u.venueVerificationPending&&!u.venueVerified?`<span class="badge-pending">⏳ Verificación pendiente</span>`:''}
          ${adminUser?'<span class="admin-badge">ADMIN</span>':''}
        </div>
        <div style="font-size:13px;color:var(--text2)">@${u.username}</div>
        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
          ${isCancha?`<span class="badge badge-verified">🏟️ Dueño de Cancha</span>`:''}
          ${!isCancha?`<span class="badge badge-open">${u.pos||'Cualquiera'}</span>`:''}
        </div>
      </div>
    </div>`;

  if(isCancha){
    html+=`<div class="card" style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;margin-bottom:10px">🏟️ Datos de la cancha</div>
      <div style="font-size:14px;font-weight:600">${u.venueName||'—'}</div>
      <div style="font-size:13px;color:var(--text2);margin-top:4px">📍 ${u.venueAddr||'—'}</div>
      <div style="font-size:13px;color:var(--text2)">📞 ${u.venuePhone||'—'}</div>
      ${u.venueVerified?`<div class="venue-verified-banner" style="margin-top:10px;margin-bottom:0">✓ Cancha verificada por Fulbito 5</div>`:''}
      ${u.venueVerificationPending&&!u.venueVerified?`<div style="margin-top:10px;font-size:12px;color:var(--gold)">⏳ Tu solicitud de verificación está en revisión</div>`:''}
    </div>`;
  } else {
    html+=`<div class="stats-grid" style="margin-bottom:16px">
      <div class="stat-box"><div class="stat-val" style="color:var(--accent)">${stats.points}</div><div class="stat-lbl">Puntos</div></div>
      <div class="stat-box"><div class="stat-val" style="color:#80e880">${stats.wins}</div><div class="stat-lbl">Victorias</div></div>
      <div class="stat-box"><div class="stat-val" style="color:var(--accent)">${stats.goals}</div><div class="stat-lbl">Goles</div></div>
      <div class="stat-box"><div class="stat-val" style="color:var(--danger)">${stats.lates}</div><div class="stat-lbl">Tarde</div></div>
      <div class="stat-box"><div class="stat-val">${stats.games}</div><div class="stat-lbl">Partidos</div></div>
      <div class="stat-box"><div class="stat-val" style="color:var(--gold)">${stats.mvps}</div><div class="stat-lbl">MVPs ⭐</div></div>
    </div>
    <div class="card" style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;margin-bottom:10px">Posición favorita</div>
      <div class="pos-grid">
        ${['Arquero','Defensor','Volante','Delantero','Cualquiera'].map(p=>`<button class="pos-btn${u.pos===p?' selected':''}" onclick="updatePos('${p}',this)">${p==='Arquero'?'🧤':p==='Defensor'?'🛡':p==='Volante'?'⚙️':p==='Delantero'?'⚡':'🎯'} ${p}</button>`).join('')}
      </div>
    </div>`;
  }

  if(myRooms.length&&!isCancha){
    html+=`<div class="card" style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;margin-bottom:10px">📋 Partidos jugados</div>
      ${myRooms.map(r=>`<div class="hist-item"><div class="hist-dot" style="background:var(--accent)"></div><div><div style="font-size:13px;font-weight:600">${r.name}</div><div style="font-size:12px;color:var(--text2)">${fmtDate(r.date,r.time)}hs · ${r.venue}${r.result?' · '+r.result.a+'-'+r.result.b:''}</div></div></div>`).join('')}
    </div>`;
  }

  if(adminUser){
    html+=`<button class="btn btn-info" onclick="goTo('s-admin')" style="margin-bottom:10px">⚙️ Panel de administración</button>`;
  }

  html+=`<button class="btn btn-danger" onclick="doLogout()" style="margin-top:4px">Cerrar sesión</button>`;

  document.getElementById('profile-content').innerHTML=html;
}

function updateProfilePhoto(input){
  readImageFile(input,result=>{users[currentUser].photo=result;save('users',users);renderProfile();});
}
function updatePos(pos,btn){
  users[currentUser].pos=pos;save('users',users);
  btn.closest('.pos-grid').querySelectorAll('.pos-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');
}
