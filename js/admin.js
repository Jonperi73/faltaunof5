//  ADMIN PANEL
// ============================================================
function renderAdmin(){
  if(!isAdmin()){goBack();return;}
  const pendingVenues=Object.values(users).filter(u=>u.accountType==='cancha'&&u.venueVerificationPending&&!u.venueVerified);
  const allVenues=Object.values(users).filter(u=>u.accountType==='cancha');

  let html=`<div style="font-size:13px;color:var(--text2);margin-bottom:16px">Acá aprobás las canchas verificadas. Las solicitudes nuevas aparecen primero.</div>`;

  html+=`<div style="font-family:var(--font-black);font-size:16px;margin-bottom:10px">⏳ Pendientes de verificación (${pendingVenues.length})</div>`;
  if(!pendingVenues.length){
    html+=`<div class="notice" style="margin-bottom:16px">No hay solicitudes pendientes.</div>`;
  } else {
    pendingVenues.forEach(u=>{
      html+=`<div class="card" style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          ${buildAvatar(u.username,'lg','')}
          <div style="flex:1">
            <div style="font-weight:700;font-size:16px">${u.venueName||u.name}</div>
            <div style="font-size:12px;color:var(--text2)">@${u.username}</div>
            <div style="font-size:12px;color:var(--text2)">📍 ${u.venueAddr||'—'}</div>
            <div style="font-size:12px;color:var(--text2)">📞 ${u.venuePhone||'—'}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-accent btn-sm" onclick="approveVenue('${u.username}')">✓ Verificar</button>
          <button class="btn btn-danger btn-sm" onclick="rejectVenue('${u.username}')">✕ Rechazar</button>
        </div>
      </div>`;
    });
  }

  html+=`<div style="font-family:var(--font-black);font-size:16px;margin:20px 0 10px">🏟️ Todas las canchas (${allVenues.length})</div>`;
  allVenues.forEach(u=>{
    html+=`<div class="card" style="margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px">
        ${buildAvatar(u.username,'sm','')}
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px">
            ${u.venueName||u.name}
            ${u.venueVerified?`<span class="verified-check" title="Verificada"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>`:''}
            ${u.venueVerificationPending&&!u.venueVerified?`<span class="badge-pending">⏳</span>`:''}
          </div>
          <div style="font-size:12px;color:var(--text2)">@${u.username} · ${u.venueAddr||'—'}</div>
        </div>
        ${u.venueVerified?`<button class="btn btn-danger btn-sm" onclick="rejectVenue('${u.username}')">Quitar</button>`:''}
      </div>
    </div>`;
  });

  document.getElementById('admin-content').innerHTML=html;
}

function approveVenue(username){
  if(!users[username])return;
  users[username].venueVerified=true;
  users[username].venueVerificationPending=false;
  save('users',users);
  renderAdmin();
  alert(`✓ @${username} verificada correctamente`);
}
function rejectVenue(username){
  if(!confirm(`¿Quitar verificación de @${username}?`))return;
  users[username].venueVerified=false;
  users[username].venueVerificationPending=false;
  save('users',users);
  renderAdmin();
}
