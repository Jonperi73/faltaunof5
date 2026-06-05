// ============================================================
//  INIT
// ============================================================
window.addEventListener('DOMContentLoaded',()=>{
  seedDemo();
  setTimeout(()=>{
    document.getElementById('splash').classList.add('hidden');
    if(currentUser&&users[currentUser]){goTo('s-home');}
    else{currentUser=null;goTo('s-auth');}
  },1200);
});
