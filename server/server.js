const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.ALLOWED_ORIGIN || '*', methods: ['GET','POST'] },
  pingInterval: 25000, pingTimeout: 20000
});
const rooms = new Map();
app.get('/', (_req,res)=>res.json({name:'STREET CLASH',status:'online',rooms:rooms.size}));
app.get('/health', (_req,res)=>res.json({ok:true}));
function makeCode(){let n;do{n=String(Math.floor(1000+Math.random()*9000));}while(rooms.has(n));return n;}
io.on('connection', socket=>{
 socket.on('create-room',()=>{
   if(socket.data.room)return;
   const id=makeCode();rooms.set(id,{host:socket.id,guest:null,createdAt:Date.now()});
   socket.join(id);socket.data.room=id;socket.emit('room-created',{code:id});
 });
 socket.on('join-room',({code:id}={})=>{
   id=String(id||'');
   const room=rooms.get(id);
   if(!/^\d{4}$/.test(id)||!room){socket.emit('room-error',{message:'Room not found.'});return;}
   if(room.guest||room.host===socket.id){socket.emit('room-error',{message:'Room is full or invalid.'});return;}
   room.guest=socket.id;socket.join(id);socket.data.room=id;
   socket.emit('room-joined',{code:id});io.to(room.host).emit('opponent-joined');
 });
 socket.on('player-input',payload=>{
   const id=socket.data.room,room=rooms.get(id);
   if(!room||!payload||payload.room!==id)return;
   const data=payload.data||{};
   const allowed=['punch','kick','special','block','release-block','jump','dodge'];
   if(data.action&&!allowed.includes(data.action))return;
   if(data.move!==undefined&&!Number.isFinite(data.move))return;
   socket.to(id).emit('peer-input',data);
 });
 socket.on('disconnect',()=>{
   const id=socket.data.room;if(!id)return;
   const room=rooms.get(id);if(!room)return;
   socket.to(id).emit('opponent-left');rooms.delete(id);
 });
});
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`STREET CLASH server listening on ${PORT}`));
