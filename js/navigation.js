// ============================================================
//  NAVIGATION
// ============================================================
function goTo(id){
  const prev=document.querySelector('.screen.active');
  if(prev && prev.id!==id) screenHistory.push(prev.id);

  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));

  const next=document.getElementById(id);
  next.classList.add('active');

  currentScreen=id;
  next.scrollTop=0;

  if(id==='s-home') renderHome();
  if(id==='s-ranking') renderRanking();
  if(id==='s-profile') renderProfile();
  if(id==='s-admin') renderAdmin();
}

function goBack(){
  console.log("Historial:", screenHistory);

  if(screenHistory.length){
    const prev=screenHistory.pop();
    goTo(prev);
  }
}

// ============================================================
//  TABS
// ============================================================
function setTab(group,tab,btn){

  const prefix=`tab-${group}-`;

  document.querySelectorAll(`[id^="${prefix}"]`).forEach(el=>{
    el.style.display=el.id===prefix+tab?'':'none';
  });

  btn.closest('.tabs').querySelectorAll('.tab').forEach(t=>{
    t.classList.remove('active');
  });

  btn.classList.add('active');

  if(group==='detail'){
    if(tab==='chat') renderChat(activeRoomId);
    if(tab==='pagos') renderPagos(activeRoomId);
    if(tab==='historial') renderHistorial(activeRoomId);

    if(tab==='info'){
      const room=rooms.find(r=>r.id===activeRoomId);
      if(room) renderDetailInfo(room);
    }
  }
}

console.log("NAVIGATION OK");