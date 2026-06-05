// ============================================================
//  FIREBASE CONFIG PLACEHOLDER
//  Reemplazá esto con tu configuración de Firebase cuando estés listo
//  https://console.firebase.google.com
// ============================================================
/*
  Para activar Firebase:
  1. Creá un proyecto en https://console.firebase.google.com
  2. Habilitá Firestore Database y Authentication (Email/Password)
  3. Copiá tu firebaseConfig acá
  4. Descomentá el bloque de inicialización
  5. Reemplazá las funciones save/load por las de Firestore

  const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();
*/

// ============================================================
//  STORAGE & STATE (localStorage — migrar a Firestore)
// ============================================================
function save(k,v){try{localStorage.setItem('f5_'+k,JSON.stringify(v))}catch(e){}}
function load(k,d){try{const v=localStorage.getItem('f5_'+k);return v?JSON.parse(v):d}catch(e){return d}}

let users=load('users',{});
let rooms=load('rooms',[]);
let currentUser=load('session',null);
let nextRoomId=load('nextRoomId',10);
let currentScreen='s-auth';
let screenHistory=[];
let activeRoomId=null;

// Admin users (en Firebase esto sería un campo en Firestore)
const ADMIN_USERS=['admin'];

const QUICK_MESSAGES=[
  {text:'⏰ Llego 10 min tarde',icon:'⏰'},
  {text:'🚗 En camino',icon:'🚗'},
  {text:'✅ Confirmado, voy!',icon:'✅'},
  {text:'❌ No puedo ir',icon:'❌'},
  {text:'🤕 Me lesioné',icon:'🤕'},
  {text:'🍺 Traigo la birra',icon:'🍺'},
  {text:'⚽ Traigo la pelota',icon:'⚽'},
  {text:'👕 Traigo pecheras',icon:'👕'},
  {text:'💳 Pago la cancha',icon:'💳'},
  {text:'🔄 Necesito cambio',icon:'🔄'},
];

// ============================================================
//  SEED DEMO DATA
// ============================================================
function seedDemo(){
  if(Object.keys(users).length>0)return;
  users={
    'admin':{username:'admin',name:'Admin',pass:'admin123',pos:'',photo:null,accountType:'admin',created:Date.now()},
    'nico':{username:'nico',name:'Nico García',pass:'1234',pos:'Delantero',photo:null,accountType:'jugador',created:Date.now()},
    'javi':{username:'javi',name:'Javi López',pass:'1234',pos:'Volante',photo:null,accountType:'jugador',created:Date.now()},
    'gonza':{username:'gonza',name:'Gonza Ruiz',pass:'1234',pos:'Defensor',photo:null,accountType:'jugador',created:Date.now()},
    'maxi':{username:'maxi',name:'Maxi Torres',pass:'1234',pos:'Arquero',photo:null,accountType:'jugador',created:Date.now()},
    'seba':{username:'seba',name:'Seba Díaz',pass:'1234',pos:'Volante',photo:null,accountType:'jugador',created:Date.now()},
    'tomas':{username:'tomas',name:'Tomás Vera',pass:'1234',pos:'Delantero',photo:null,accountType:'jugador',created:Date.now()},
    'diego':{username:'diego',name:'Diego Moreno',pass:'1234',pos:'Defensor',photo:null,accountType:'jugador',created:Date.now()},
    'lucas':{username:'lucas',name:'Lucas Romero',pass:'1234',pos:'Cualquiera',photo:null,accountType:'jugador',created:Date.now()},
    'complejo5':{username:'complejo5',name:'Complejo 5 La Plata',pass:'1234',pos:'',photo:null,accountType:'cancha',venueVerified:true,venueName:'Complejo 5',venueAddr:'Calle 7 y 44, La Plata',venuePhone:'+54 221 555-1234',created:Date.now()},
    'lapamba':{username:'lapamba',name:'La Bamba Fútbol',pass:'1234',pos:'',photo:null,accountType:'cancha',venueVerified:false,venueVerificationPending:true,venueName:'La Bamba',venueAddr:'Av. 25 s/n, La Plata',venuePhone:'+54 221 555-5678',created:Date.now()},
  };
  rooms=[
    {
      id:1,name:'Miércoles Complejo 5',venue:'Complejo 5',address:'Calle 7 y 44',
      date:'2026-06-04',time:'17:00',max:10,cost:2500,
      desc:'Llevar pechera oscura. Se juntan en la entrada.',isPrivate:false,code:'PUBLIC',
      owner:'complejo5',ownerIsVenue:true,players:['nico','javi','gonza','maxi','lucas','seba','tomas'],
      lates:{maxi:3,javi:1,tomas:2},goals:{javi:8,nico:5,gonza:3,lucas:2},
      result:{a:4,b:3},mvpVotes:{},mvpWinner:'javi',
      confirm:{nico:'yes',javi:'yes',gonza:'yes',maxi:'maybe',lucas:'yes',seba:'no',tomas:'yes'},
      payments:{nico:true,javi:true,gonza:false,maxi:true,lucas:false,seba:true,tomas:false},
      chat:[
        {user:'nico',text:'Che, confirmamos para el miércoles?',ts:Date.now()-7200000},
        {user:'javi',text:'⏰ Llego 10 min tarde',ts:Date.now()-3600000},
        {user:'maxi',text:'🚗 En camino',ts:Date.now()-1800000},
        {user:'gonza',text:'✅ Confirmado, voy!',ts:Date.now()-900000},
      ],
      playerStatus:{javi:'⏰ Llego 10 min tarde',maxi:'🚗 En camino',gonza:'✅ Confirmado, voy!'},
      positions:{},pitchLocked:false,
      teamA:['nico','javi','gonza','maxi','lucas'],teamB:['seba','tomas'],
      created:Date.now()-86400000,finished:true
    },
    {
      id:2,name:'Jueves Flash',venue:'Polideportivo Sur',address:'Av. 25 s/n',
      date:'2026-06-05',time:'20:00',max:10,cost:0,
      desc:'Entrada libre.',isPrivate:false,code:'PUBLIC',
      owner:'seba',ownerIsVenue:false,players:['seba','tomas','nico'],
      lates:{},goals:{},result:null,mvpVotes:{},mvpWinner:null,
      confirm:{},payments:{},chat:[],playerStatus:{},positions:{},pitchLocked:false,
      created:Date.now()-3600000,finished:false
    },
    {
      id:3,name:'Los Cracks Privado',venue:'La Bamba',address:'',
      date:'2026-06-06',time:'18:30',max:10,cost:3000,
      desc:'Solo invitados.',isPrivate:true,code:'CRACK1',
      owner:'diego',ownerIsVenue:false,players:['diego','lucas','gonza','maxi'],
      lates:{},goals:{},result:null,mvpVotes:{},mvpWinner:null,
      confirm:{},payments:{},chat:[],playerStatus:{},positions:{},pitchLocked:false,
      created:Date.now()-7200000,finished:false
    }
  ];
  save('users',users);save('rooms',rooms);save('nextRoomId',10);
}

// ============================================================
