//  DRAGGABLE PITCH
// ============================================================
let dragState=null;

function positionsFor(count,side,W,H){
  const p=[];const cx=side==='left'?W*0.24:W*0.76;
  if(count===1)p.push([cx,H/2]);
  else if(count===2)p.push([cx,H*0.35],[cx,H*0.65]);
  else if(count===3)p.push([cx,H*0.25],[cx,H*0.5],[cx,H*0.75]);
  else if(count===4)p.push([cx-18,H*0.3],[cx+18,H*0.3],[cx-18,H*0.7],[cx+18,H*0.7]);
  else if(count===5){const c=side==='left'?[W*0.13,W*0.27,W*0.21]:[W*0.87,W*0.73,W*0.79];p.push([c[0],H*0.5],[c[1],H*0.25],[c[1],H*0.75],[c[2],H*0.42],[c[2],H*0.58]);}
  else if(count===6){const o=26;p.push([cx,H*0.2],[cx,H*0.8],[cx-o,H*0.35],[cx-o,H*0.65],[cx+o,H*0.4],[cx+o,H*0.6]);}
  else{for(let i=0;i<count;i++){const a=(i/count)*Math.PI*2;p.push([cx+Math.cos(a)*36,H/2+Math.sin(a)*36*0.7]);}}
  return p;
}

function buildDraggablePitch(room,containerId){
  const container=document.getElementById(containerId);
  if(!container)return;
  container.innerHTML='';

  const W=340,H=220,AV=30;
  const half=Math.ceil(room.max/2);
  const players=room.players;
  const teamA=room.teamA||players.slice(0,Math.min(half,players.length));
  const teamB=room.teamB||players.slice(half,Math.min(room.max,players.length));
  const storedPos=room.positions||{};
  const statuses=room.playerStatus||{};
  const isOwner=room.owner===currentUser;
  const locked=room.pitchLocked&&!isOwner;

  const posA=positionsFor(half,'left',W,H);
  const posB=positionsFor(half,'right',W,H);

  // Build SVG field background
  const svgField=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">
    <rect width="${W}" height="${H}" fill="#3a7a3a"/>
    ${Array.from({length:9},(_,i)=>`<rect x="${i*38}" y="0" width="38" height="${H}" fill="${i%2===0?'rgba(0,0,0,0.04)':'rgba(255,255,255,0.02)'}" />`).join('')}
    <rect x="8" y="8" width="${W-16}" height="${H-16}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" rx="2"/>
    <line x1="${W/2}" y1="8" x2="${W/2}" y2="${H-8}" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
    <circle cx="${W/2}" cy="${H/2}" r="28" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
    <circle cx="${W/2}" cy="${H/2}" r="3" fill="rgba(255,255,255,0.7)"/>
    <rect x="8" y="${H/2-30}" width="22" height="60" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.2"/>
    <rect x="${W-30}" y="${H/2-30}" width="22" height="60" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.2"/>
    <rect x="2" y="${H/2-18}" width="8" height="36" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.55)" stroke-width="1"/>
    <rect x="${W-10}" y="${H/2-18}" width="8" height="36" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.55)" stroke-width="1"/>
    <text x="${W*0.24}" y="6" text-anchor="middle" font-size="7" fill="rgba(200,240,64,0.85)" font-family="Archivo Black,sans-serif">EQUIPO A</text>
    <text x="${W*0.76}" y="6" text-anchor="middle" font-size="7" fill="rgba(255,96,96,0.85)" font-family="Archivo Black,sans-serif">EQUIPO B</text>
  </svg>`;

  const pitchWrap=document.createElement('div');
  pitchWrap.style.cssText='position:relative;border-radius:16px;overflow:hidden';
  pitchWrap.innerHTML=svgField;

  // Get actual rendered width for coordinate mapping
  container.appendChild(pitchWrap);
  const svgEl=pitchWrap.querySelector('svg');

  // Overlay layer for draggable players
  const overlay=document.createElement('div');
  overlay.style.cssText=`position:absolute;inset:0;pointer-events:none`;
  pitchWrap.appendChild(overlay);

  function svgToPercent(x,y){return{px:(x/W)*100,py:(y/H)*100};}
  function getDefaultPos(username,team,idx){
    const posArr=team==='a'?posA:posB;
    if(posArr[idx])return{px:(posArr[idx][0]/W)*100,py:(posArr[idx][1]/H)*100};
    return{px:50,py:50};
  }

  function createPlayerNode(username,team,idx){
    const u=users[username]||{name:username,photo:null};
    const av=avatarColor(u.name);
    const defaultPos=getDefaultPos(username,team,idx);
    const stored=storedPos[username];
    const px=stored?stored[0]:defaultPos.px;
    const py=stored?stored[1]:defaultPos.py;
    const status=statuses[username]||'';
    const ringColor=team==='a'?'#c8f040':'#ff6060';
    const dispName=(u.name||username).split(' ')[0].slice(0,7);

    const node=document.createElement('div');
    node.className='draggable-player';
    node.dataset.username=username;
    node.dataset.team=team;

    const canDrag=isOwner||(username===currentUser&&!room.pitchLocked);
    if(!canDrag)node.classList.add('locked');

    node.style.cssText=`position:absolute;left:${px}%;top:${py}%;transform:translate(-50%,-50%);pointer-events:all;z-index:10`;

    let avatarHTML=u.photo
      ?`<img src="${u.photo}" style="width:${AV}px;height:${AV}px;object-fit:cover;border-radius:50%;display:block"/>`
      :buildAvatarSvg(u.name,AV);

    node.innerHTML=`
      ${status?`<div class="status-bubble-html">${status.slice(0,14)}</div>`:''}
      <div class="player-ring" style="border-color:${ringColor};width:${AV+5}px;height:${AV+5}px">${avatarHTML}</div>
      <div class="player-label">${dispName}</div>
    `;

    if(canDrag){
      node.addEventListener('mousedown',startDrag);
      node.addEventListener('touchstart',startDrag,{passive:false});
    }

    overlay.appendChild(node);
    return node;
  }

  // Render all players
  teamA.forEach((p,i)=>createPlayerNode(p,'a',i));
  teamB.forEach((p,i)=>createPlayerNode(p,'b',i));

  // Empty slots
  for(let i=teamA.length;i<half;i++){
    const pos=posA[i];if(!pos)continue;
    const empty=document.createElement('div');
    empty.style.cssText=`position:absolute;left:${(pos[0]/W)*100}%;top:${(pos[1]/H)*100}%;transform:translate(-50%,-50%);pointer-events:none;z-index:5`;
    empty.innerHTML=`<div style="width:${AV+5}px;height:${AV+5}px;border-radius:50%;border:1.5px dashed rgba(200,240,64,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;color:rgba(200,240,64,0.4)">+</div>`;
    overlay.appendChild(empty);
  }
  for(let i=teamB.length;i<half;i++){
    const pos=posB[i];if(!pos)continue;
    const empty=document.createElement('div');
    empty.style.cssText=`position:absolute;left:${(pos[0]/W)*100}%;top:${(pos[1]/H)*100}%;transform:translate(-50%,-50%);pointer-events:none;z-index:5`;
    empty.innerHTML=`<div style="width:${AV+5}px;height:${AV+5}px;border-radius:50%;border:1.5px dashed rgba(255,96,96,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;color:rgba(255,96,96,0.4)">+</div>`;
    overlay.appendChild(empty);
  }
}

function startDrag(e){
  e.preventDefault();
  const node=e.currentTarget;
  const username=node.dataset.username;
  const room=rooms.find(r=>r.id===activeRoomId);
  if(!room)return;

  const isOwner=room.owner===currentUser;
  if(!isOwner&&username!==currentUser)return;
  if(!isOwner&&room.pitchLocked)return;

  node.classList.add('dragging');
  const overlay=node.parentElement;
  const rect=overlay.getBoundingClientRect();

  const getXY=(ev)=>{
    const t=ev.touches?ev.touches[0]:ev;
    return{x:t.clientX,y:t.clientY};
  };

  function onMove(ev){
    ev.preventDefault();
    const{x,y}=getXY(ev);
    const px=((x-rect.left)/rect.width)*100;
    const py=((y-rect.top)/rect.height)*100;
    const clampedX=Math.max(2,Math.min(98,px));
    const clampedY=Math.max(2,Math.min(98,py));
    node.style.left=clampedX+'%';
    node.style.top=clampedY+'%';
  }

  function onEnd(ev){
    node.classList.remove('dragging');
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('mouseup',onEnd);
    document.removeEventListener('touchmove',onMove);
    document.removeEventListener('touchend',onEnd);

    const px=parseFloat(node.style.left);
    const py=parseFloat(node.style.top);
    if(!room.positions)room.positions={};
    room.positions[username]=[px,py];
    save('rooms',rooms);
  }

  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onEnd);
  document.addEventListener('touchmove',onMove,{passive:false});
  document.addEventListener('touchend',onEnd);
}

function togglePitchLock(roomId){
  const room=rooms.find(r=>r.id===roomId);if(!room)return;
  room.pitchLocked=!room.pitchLocked;
  save('rooms',rooms);
  renderDetailInfo(room);
}

function resetPositions(roomId){
  const room=rooms.find(r=>r.id===roomId);if(!room)return;
  room.positions={};
  save('rooms',rooms);
  renderDetailInfo(room);
}

// ============================================================
