//  AUTH
// ============================================================
let regSelectedPos='';
let regSelectedAccountType='jugador';

function selectAccountType(type,card){
  regSelectedAccountType=type;
  document.querySelectorAll('.account-type-card').forEach(c=>c.classList.remove('selected'));
  card.classList.add('selected');
  document.getElementById('reg-player-fields').style.display=type==='jugador'?'':'none';
  document.getElementById('reg-cancha-fields').style.display=type==='cancha'?'':'none';
}
function togglePos(btn,pos){document.querySelectorAll('#reg-pos-grid .pos-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');regSelectedPos=pos;}
function showRegister(){document.getElementById('auth-login-form').style.display='none';document.getElementById('auth-register-form').style.display='block';}
function showLogin(){document.getElementById('auth-login-form').style.display='block';document.getElementById('auth-register-form').style.display='none';}
function previewPhoto(input,previewId,dataId){
  readImageFile(input,result=>{document.getElementById(dataId).value=result;document.getElementById(previewId).innerHTML=`<img src="${result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;});
}
async function doLogin(){
  const email=document.getElementById('login-email').value.trim();
  const p=document.getElementById('login-pass').value;

  try{
    const cred = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      p
    );

    console.log("Login correcto:", cred.user.uid);

    afterLogin();

  }catch(error){
    console.error(error);
    alert("Email o contraseña incorrectos.");
  }
}
async function doRegister(){
  const name=document.getElementById('reg-name').value.trim();
  const u=document.getElementById('reg-user').value.trim().toLowerCase().replace(/\s/g,'');
  const email=document.getElementById('reg-email').value.trim();
  const p=document.getElementById('reg-pass').value;
  const photo=document.getElementById('reg-photo-data').value;
  if(!name||!u||!email||!p)return alert('Completá todos los campos.');
  if(p.length<4)return alert('Contraseña mínimo 4 caracteres.');
  if(users[u])return alert('Ese usuario ya existe.');
  try{
  const cred = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    p
  );

  console.log("Usuario Firebase creado:", cred.user.uid);
  await setDocFirestore(
  docFirestore(firebaseDB, "users", cred.user.uid),
  {
    username: u,
    name: name,
    email: email,
    accountType: regSelectedAccountType,
    created: Date.now()
  }
);

console.log("Perfil guardado en Firestore");

  }catch(error){
    console.error(error);
    alert(error.message);
    return;
  }

  const newUser={
  username:u,
  name,
  email,
  pass:p,
  photo:photo||null,
  accountType:regSelectedAccountType,
  created:Date.now()
};

  if(regSelectedAccountType==='cancha'){
    const vname=document.getElementById('reg-venue-name').value.trim();
    const vaddr=document.getElementById('reg-venue-addr').value.trim();
    const vphone=document.getElementById('reg-venue-phone').value.trim();
    if(!vname||!vaddr)return alert('Completá los datos de la cancha.');
    newUser.venueName=vname;newUser.venueAddr=vaddr;newUser.venuePhone=vphone;
    newUser.venueVerified=false;newUser.venueVerificationPending=true;newUser.pos='';
  } else {
    newUser.pos=regSelectedPos||'Cualquiera';
  }

  users[u]=newUser;
  save('users',users);currentUser=u;save('session',u);afterLogin();
}
function afterLogin(){

  if(firebaseAuth.currentUser){

    const email = firebaseAuth.currentUser.email;

    const foundUser = Object.keys(users).find(
      key => users[key].email === email
    );

    if(foundUser){
      currentUser = foundUser;
      save('session', foundUser);
    }
  }

  goTo('s-home');
  renderHome();
}
async function doLogout(){

  try{

    await signOutFirebase(firebaseAuth);

    currentUser=null;
    save('session',null);

    goTo('s-auth');

  }catch(error){

    console.error(error);
    alert("Error al cerrar sesión");

  }

}
function isAdmin(){return currentUser&&(users[currentUser]?.accountType==='admin'||ADMIN_USERS.includes(currentUser));}
function isVenueOwner(){return currentUser&&users[currentUser]?.accountType==='cancha';}
function isVenueVerified(username){return users[username]?.accountType==='cancha'&&users[username]?.venueVerified===true;}

