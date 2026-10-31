const $=s=>document.querySelector(s);
const panel=$('#onlinePanel'),status=$('#onlineStatus'),code=$('#roomCode');
let socket=null,role='host',pending=null;
function open(){panel.classList.remove('hidden');}
function connectThen(task){
 open();
 const url=prompt('Enter deployed STREET CLASH server URL (example: https://your-game-server.onrender.com)');
 if(!url)return;
 if(!window.io){status.textContent='Socket.IO client failed to load.';return;}
 socket=window.io(url.trim().replace(/\/+$/,''),{transports:['websocket','polling'],timeout:10000});
 status.textContent='Connecting to game server…';
 socket.on('connect',()=>{status.textContent='Connected. '+(task==='create'?'Creating private room…':'Enter your friend’s 4-digit room code.');if(task==='create')socket.emit('create-room');});
 socket.on('connect_error',()=>{status.textContent='Connection failed. Check server URL and try again.';});
 socket.on('room-created',d=>{role='host';window.SC_ROOM=d.code;code.textContent='ROOM CODE: '+d.code;status.textContent='Room created. Share this code with your friend.';});
 socket.on('room-joined',d=>{role='guest';window.SC_ROOM=d.code;code.textContent='ROOM CODE: '+d.code;status.textContent='Joined room. Loading match…';window.STREET_CLASH_NET?.setOnline(socket,role);});
 socket.on('opponent-joined',()=>{status.textContent='Opponent connected. Fight!';window.STREET_CLASH_NET?.setOnline(socket,role);});
 socket.on('peer-input',d=>window.STREET_CLASH_NET?.receive({type:'input',data:d}));
 socket.on('opponent-left',()=>window.STREET_CLASH_NET?.receive({type:'leave'}));
 socket.on('room-error',d=>{status.textContent=d.message||'Room error.';});
}
$('#createRoomBtn').addEventListener('click',()=>connectThen('create'));
$('#joinRoomBtn').addEventListener('click',()=>{open();if(!socket?.connected)connectThen('join');else status.textContent='Enter your friend’s 4-digit room code.';});
$('#connectRoomBtn').addEventListener('click',()=>{
 const v=$('#roomInput').value.trim();
 if(!/^\d{4}$/.test(v)){status.textContent='Enter a valid 4-digit room code.';return;}
 if(!socket?.connected){status.textContent='Connect to your server first.';return;}
 socket.emit('join-room',{code:v});
});
$('#copyRoomBtn').addEventListener('click',async()=>{if(window.SC_ROOM){try{await navigator.clipboard.writeText(window.SC_ROOM);status.textContent='Room code copied.';}catch{status.textContent='Room code: '+window.SC_ROOM;}}});
$('#closeOnlineBtn').addEventListener('click',()=>{panel.classList.add('hidden');window.STREET_CLASH_NET?.leave();socket?.disconnect();socket=null;});
