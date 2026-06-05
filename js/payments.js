//  PAGOS
// ============================================================
function renderPagos(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  const el=document.getElementById('tab-detail-pagos');if(!el)return;
  const isOwner=room.owner===currentUser;
  const payments=room.payments||{};
  const paid=Object.values(payments).filter(Boolean).length;
  const total=room.players.length;
  const totalAmount=room.cost*total;
  el.innerHTML=`<div class="card" style="margin-bottom:12px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font-family:var(--font-black);font-size:22px;color:var(--accent)">$${totalAmount.toLocaleString()}</div>
      <div style="font-size:13px;color:var(--text2)">${paid}/${total} pagaron</div>
    </div>
    <div style="background:var(--card2);border-radius:6px;height:8px;overflow:hidden;margin-bottom:4px">
      <div style="background:var(--accent);height:100%;width:${total?Math.round(paid/total*100):0}%;transition:width 0.4s"></div>
    </div>
    <div style="font-size:11px;color:var(--text2)">Costo por jugador: $${room.cost.toLocaleString()}</div>
  </div>
  <div class="card">
    <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">Estado de pagos</div>
    ${room.players.map(p=>{
      const u=users[p]||{name:p};const pago=payments[p]||false;const isMe=p===currentUser;
      return`<div class="pay-row">
        ${buildAvatar(p,'sm','')}
        <div style="flex:1;font-size:14px">${u.name||p}${isMe?' <span style="font-size:11px;color:var(--accent)">tú</span>':''}</div>
        ${isOwner||isMe?`<button onclick="togglePayment(${id},'${p}')" class="btn btn-sm ${pago?'btn-accent':'btn-outline'}" style="font-size:12px">${pago?'✓ Pagó':'Pendiente'}</button>`:
          `<span style="font-size:12px;font-weight:600;color:${pago?'var(--accent)':'var(--danger)'}">${pago?'✓ Pagó':'⚠ Debe'}</span>`}
      </div>`;
    }).join('')}
  </div>`;
}
function togglePayment(id,player){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  if(!room.payments)room.payments={};
  room.payments[player]=!room.payments[player];
  save('rooms',rooms);renderPagos(id);
}

// ============================================================
