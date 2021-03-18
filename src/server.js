const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const https = require('https')
const fs = require('fs');
const cluster = require("cluster");
const redisAdapter = require("socket.io-redis");
const { setupMaster, setupWorker } = require("@socket.io/sticky");

const numCPUs = require("os").cpus().length;


const app = express()
app.use(cors())

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/josholie.world/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/josholie.world/fullchain.pem')
};

// const options = {
//   key: fs.readFileSync('./localhost.key'),
//   cert: fs.readFileSync('./localhost.crt'),
// };



const server = require('https').createServer(options, app);

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))
app.get('/', function (req, res) {
   res.sendFile('index.html', { root: __dirname })
})

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  console.log(`Master ${JSON.stringify(process)} is running`);
  console.log(`Load balancing : ${numCPUs} will be used`);

  setupMaster(server, {
    loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
  });
  server.listen(443, () => {
    console.log('HTTPS Server running on port 443');
  });

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);

  const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
  });
  io.adapter(redisAdapter({ host: "localhost", port: 6379 }));
  setupWorker(io);

  io.on('connection', (socket) =>{
    console.log(`Connecté au client ${socket.id}`)
    socket.emit("sendId", {id: socket.id});
    clientSockets[socket.id] = socket;
 
    // -------------------------- LISTENERS
 
     // Rejoindre une partie
     socket.on('join', (payload) =>{
         console.log(`Join ${payload.receiverId}`)
         const player1socket = clientSockets[payload.receiverId]
         if(player1socket){
          player1socket.emit("join", payload);
         }
     })
 
       // Jouer un coup
       socket.on('playPush', (payload) =>{
         console.log(`Played push ${payload.positionIndex}`)
         const player1socket = clientSockets[payload.receiverId]
         if(player1socket){
          player1socket.emit("playPush", payload);
         }
     })
 
       // Envoyer un coup réussi
       socket.on('successHit', (payload) => {
         console.log(`Success hit to ${payload.receiverId}`)
         const player2socket = clientSockets[payload.receiverId]
         if(player2socket){
          player2socket.emit("successHit", payload);
         }
     })
 })
 
}

// ------ Ajout de socket.io
// const io = require('socket.io')(server, {
//   cors: {
//     origin: '*',
//   }
// });

// const clientSockets = {};

// Etablissement de la connexion d'un client
// io.on('connection', (socket) =>{
//    console.log(`Connecté au client ${socket.id}`)
//    socket.emit("sendId", {id: socket.id});
//    clientSockets[socket.id] = socket;

//    // -------------------------- LISTENERS

//     // Rejoindre une partie
//     socket.on('join', (payload) =>{
//         console.log(`Join ${payload.receiverId}`)
//         const player1socket = clientSockets[payload.receiverId]
//         player1socket.emit("join", payload);
//     })

//       // Jouer un coup
//       socket.on('playPush', (payload) =>{
//         console.log(`Played push ${payload.positionIndex}`)
//         const player1socket = clientSockets[payload.receiverId]
//         player1socket.emit("playPush", payload);
//     })

//       // Envoyer un coup réussi
//       socket.on('successHit', (payload) => {
//         console.log(`Success hit to ${payload.receiverId}`)
//         const player2socket = clientSockets[payload.receiverId]
//         player2socket.emit("successHit", payload);
//     })
// })


// Ecoute du port HTTPS
// server.listen(443, () => {
//     console.log('HTTPS Server running on port 443');
// });