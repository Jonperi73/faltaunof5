//  HELPERS
// ============================================================
function fmtDate(d,t){if(!d)return'—';const[y,m,day]=d.split('-');const months=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];return`${day} ${months[parseInt(m)-1]}${t?' '+t:''}`;}
function fmtTime(ts){const d=new Date(ts);return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');}
function rndCode(){return Math.random().toString(36).toUpperCase().slice(2,8)}
const AVG_COLORS=[{bg:'#2d1a4a',color:'#c0a0ff'},{bg:'#1a3a2a',color:'#80e8a0'},{bg:'#3a1a1a',color:'#ff9090'},{bg:'#1a2a3a',color:'#80c0ff'},{bg:'#3a2a1a',color:'#ffc080'},{bg:'#1a3a3a',color:'#80e8e8'},{bg:'#2a1a3a',color:'#e080ff'},{bg:'#2a3a1a',color:'#c0e880'}];
function avatarColor(name){let h=0;for(let c of(name||'?'))h=(h*31+c.charCodeAt(0))%AVG_COLORS.length;return AVG_COLORS[h]}
function initials(name){return(name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
function buildAvatarSvg(name,size){
  const av=avatarColor(name);
  const s=parseInt(size);
  return`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg"><circle cx="${s/2}" cy="${s/2}" r="${s/2}" fill="${av.bg}"/><circle cx="${s/2}" cy="${s*0.38}" r="${s*0.22}" fill="${av.color}" opacity="0.8"/><path d="M${s*0.18} ${s*0.88} Q${s/2} ${s*0.6} ${s*0.82} ${s*0.88}" fill="${av.color}" opacity="0.5"/><text x="${s/2}" y="${s*0.52}" text-anchor="middle" font-size="${s*0.28}px" font-weight="700" fill="${av.color}" font-family="Archivo Black,sans-serif" dominant-baseline="middle">${initials(name)}</text></svg>`;
}

function readImageFile(input,onLoad){
  const file=input.files[0];if(!file)return;
  const r=new FileReader();r.onload=e=>onLoad(e.target.result,e);r.readAsDataURL(file);
}
function getCountdown(dateStr,timeStr){
  if(!dateStr)return null;
  const now=new Date();
  const target=new Date(`${dateStr}T${timeStr||'00:00'}:00`);
  const diff=target-now;
  if(diff<0)return{label:'Finalizado',type:'past'};
  const h=Math.floor(diff/3600000);
  const d=Math.floor(h/24);
  if(d>1)return{label:`En ${d} días`,type:'future'};
  if(h>1)return{label:`En ${h}h`,type:'soon'};
  const m=Math.floor((diff%3600000)/60000);
  return{label:`En ${m}min`,type:'soon'};
}
