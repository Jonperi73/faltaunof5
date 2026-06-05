// ============================================================
//  INIT
// ============================================================
window.addEventListener('DOMContentLoaded',()=>{

  seedDemo();

  setTimeout(()=>{

    document.getElementById('splash').classList.add('hidden');

    console.log("FirebaseAuth existe:", typeof firebaseAuth);

    console.log("Usuario actual Firebase:", firebaseAuth?.currentUser);

    if(firebaseAuth.currentUser){
       afterLogin();
    }else{
       goTo('s-auth');
    }

  },1200);

});
