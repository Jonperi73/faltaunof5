//  CHAT
// ============================================================
function postChatMsg(room,text,isSystem){
  if(!room.chat)room.chat=[];
  room.chat.push({user:currentUser,text,ts:Date.now(),system:isSystem||false});
  save('rooms',rooms);
}
function renderChat(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  const el=document.getElementById('tab-detail-chat');if(!el)return;
  const msgs=room.chat||[];
  const msgsHtml=msgs.length?msgs.map(m=>{
    const u=users[m.user]||{name:m.user};
    const isMe=m.user===currentUser;
    return`<div class="chat-msg ${isMe?'mine':''}">
      ${!isMe?buildAvatar(m.user,'sm','flex-shrink:0'):''}
      <div style="max-width:75%">
        ${!isMe?`<div class="chat-sender">${u.name}</div>`:''}
        <div class="chat-bubble ${isMe?'mine':'theirs'}">${m.text}</div>
        <div style="font-size:10px;color:var(--text2);margin-top:2px;text-align:${isMe?'right':'left'}">${fmtTime(m.ts)}</div>
      </div>
    </div>`;
  }).join(''):`<div style="text-align:center;padding:2rem;color:var(--text2);font-size:13px">Sé el primero en escribir</div>`;
  const inRoom=room.players.includes(currentUser);
  el.innerHTML=`
    <div style="margin-bottom:12px">
      <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Mensajes rápidos</div>
      <div class="quick-msgs">${QUICK_MESSAGES.map(m=>`<div class="qmsg" onclick="sendQuickChat(${id},'${m.text.replace(/'/g,"\\'")}')">${m.text}</div>`).join('')}</div>
    </div>
    <div class="chat-wrap" id="chat-msgs-${id}">${msgsHtml}</div>
    ${inRoom?`<div class="chat-input-row">
      <input class="chat-input" id="chat-input-${id}" placeholder="Escribí algo..." onkeydown="if(event.key==='Enter')sendChat(${id})"/>
      <button class="btn btn-accent btn-sm" onclick="sendChat(${id})" style="width:auto;flex-shrink:0">▶</button>
    </div>`:`<div class="notice">Anotate para chatear</div>`}`;
  setTimeout(()=>{const wrap=document.getElementById(`chat-msgs-${id}`);if(wrap)wrap.scrollTop=wrap.scrollHeight;},50);
}
function sendChat(id){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  const input=document.getElementById(`chat-input-${id}`);
  const text=input?input.value.trim():'';if(!text)return;
  postChatMsg(room,text,false);
  input.value='';
  renderChat(id);
}
function sendQuickChat(id,text){
  const room=rooms.find(r=>r.id===id);if(!room)return;
  if(!room.players.includes(currentUser))return;
  postChatMsg(room,text,false);
  renderChat(id);
}

// ============================================================
