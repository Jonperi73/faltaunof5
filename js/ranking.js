//  RANKING
// ============================================================
function calcStats(){
  const stats={};
  Object.keys(users).filter(u=>users[u].accountType==='jugador'||!users[u].accountType).forEach(u=>{stats[u]={name:users[u].name,username:u,points:0,wins:0,losses:0,draws:0,lates:0,goals:0,games:0,mvps:0};});
  rooms.forEach(room=>{
    room.players.forEach(p=>{if(!stats[p])stats[p]={name:(users[p]||{name:p}).name,username:p,points:0,wins:0,losses:0,draws:0,lates:0,goals:0,games:0,mvps:0};stats[p].games++;});
    if(room.result){
      const half=Math.ceil(room.max/2);
      const ta=room.teamA||room.players.slice(0,half);
      const tb=room.teamB||room.players.slice(half);
      const aw=room.result.a>room.result.b,bw=room.result.b>room.result.a,dr=room.result.a===room.result.b;
      ta.forEach(p=>{if(!stats[p])return;if(aw){stats[p].points+=3;stats[p].wins++;}else if(dr){stats[p].points+=1;stats[p].draws++;}else stats[p].losses++;});
      tb.forEach(p=>{if(!stats[p])return;if(bw){stats[p].points+=3;stats[p].wins++;}else if(dr){stats[p].points+=1;stats[p].draws++;}else stats[p].losses++;});
    }
    Object.entries(room.lates||{}).forEach(([p,v])=>{if(stats[p])stats[p].lates+=v;});
    Object.entries(room.goals||{}).forEach(([p,v])=>{if(stats[p])stats[p].goals+=v;});
    if(room.mvpWinner&&stats[room.mvpWinner])stats[room.mvpWinner].mvps++;
  });
  return Object.values(stats).filter(s=>s.games>0||s.goals>0||s.mvps>0);
}
function renderRanking(){
  const stats=calcStats();
  const medals=['🥇','🥈','🥉'];
  function row(s,i,field,lbl,color){
    return`<div class="rank-row">
      <span style="font-size:16px">${medals[i]||i+1}</span>
      ${buildAvatar(s.username,'sm','')}
      <div style="flex:1"><div style="font-size:14px;font-weight:600">${s.name}</div><div style="font-size:11px;color:var(--text2)">${users[s.username]?.pos||''} · ${s.games} partidos</div></div>
      <div style="text-align:right"><div style="font-family:var(--font-black);font-size:20px;color:${color}">${s[field]}</div><div style="font-size:11px;color:var(--text2)">${lbl}</div></div>
    </div>`;
  }
  const empty='<div style="padding:2rem;text-align:center;color:var(--text2);font-size:13px">Sin datos aún.</div>';
  const byPts=[...stats].sort((a,b)=>b.points-a.points);
  const byLate=[...stats].sort((a,b)=>b.lates-a.lates).filter(s=>s.lates>0);
  const byGoals=[...stats].sort((a,b)=>b.goals-a.goals).filter(s=>s.goals>0);
  const byMvp=[...stats].sort((a,b)=>b.mvps-a.mvps).filter(s=>s.mvps>0);
  document.getElementById('tab-rank-puntos').innerHTML=byPts.length?byPts.map((s,i)=>row(s,i,'points','pts','var(--accent)')).join(''):empty;
  document.getElementById('tab-rank-tarde').innerHTML=byLate.length?byLate.map((s,i)=>row(s,i,'lates','tarde','var(--danger)')).join(''):'<div style="padding:2rem;text-align:center;color:var(--text2)">Todos llegaron a tiempo 🎉</div>';
  document.getElementById('tab-rank-goles').innerHTML=byGoals.length?byGoals.map((s,i)=>row(s,i,'goals','goles','var(--accent)')).join(''):empty;
  document.getElementById('tab-rank-mvp').innerHTML=byMvp.length?byMvp.map((s,i)=>row(s,i,'mvps','MVPs','var(--gold)')).join(''):empty;
}

// ============================================================
