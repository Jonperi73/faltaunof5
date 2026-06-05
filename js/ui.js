// ============================================================
//  UI HELPERS
// ============================================================
function buildAvatar(username,sizeClass='',extraStyle=''){
  const u=users[username]||{name:username,photo:null};
  const av=avatarColor(u.name);
  const sz=sizeClass==='sm'?'28px':sizeClass==='lg'?'52px':sizeClass==='xl'?'80px':'38px';
  if(u.photo)return`<div style="width:${sz};height:${sz};border-radius:50%;overflow:hidden;flex-shrink:0;${extraStyle}"><img src="${u.photo}" style="width:100%;height:100%;object-fit:cover"/></div>`;
  return`<div style="width:${sz};height:${sz};border-radius:50%;background:${av.bg};flex-shrink:0;overflow:hidden;${extraStyle}">${buildAvatarSvg(u.name,sz)}</div>`;
}

function buildVerifiedBadge(username){
  if(!isVenueVerified(username))return'';
  return`<span class="verified-check" title="Cancha verificada"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>`;
}

//  MODAL
// ============================================================
function openModal(html){document.getElementById('modal-body').innerHTML=html;document.getElementById('modal-backdrop').classList.add('open');}
function closeModal(e){if(!e||e.target===document.getElementById('modal-backdrop'))document.getElementById('modal-backdrop').classList.remove('open');}
