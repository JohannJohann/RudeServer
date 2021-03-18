const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const https = require('https')
const fs = require('fs');
const cluster = require("cluster");
const redisAdapter = require("socket.io-redis");
var sticky = require('sticky-session');

const numCPUs = require("os").cpus().length;

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/josholie.world/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/josholie.world/fullchain.pem')
};

// const options = {
//   key: fs.readFileSync('/Users/josh/Desktop/RudeApp/NodeServerRude/localhost.key'),
//   cert: fs.readFileSync('/Users/josh/Desktop/RudeApp/NodeServerRude/localhost.crt'),
// };

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))
app.get('/', function (req, res) {
   res.sendFile('index.html', { root: __dirname })
})

var server = require('https').createServer(options, app);
var clientSockets = {};

if (!sticky.listen(server, 443)) {
  // Master code
  server.once('listening', function() {
    console.log('Server started on 443 port');
  });
} else {
  // Worker code
  const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
  });

  io.adapter(redisAdapter({ host: "localhost", port: 6379 }));

  io.on('connection', (socket) =>{
    console.log(`Connecté au client ${socket.id} via le process ${process.pid}`)
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

// CODE STICKY 2
// if (cluster.isMaster) {
//   console.log(`Master ${process.pid} is running`);
//   console.log(`Load balancing : ${numCPUs} will be used`);

//   const server = require('https').createServer(options, app);
//   const io = require('socket.io')(server, {
//     cors: {
//       origin: '*',
//     }
//   });
//   io.adapter(redisAdapter({ host: "localhost", port: 6379 }));
//   setupMaster(server, {
//     loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
//   });
//   if(!server.listen(443, () => {
//     console.log('HTTPS Server running on port 443');
//   });

//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork().on('listening', (address) => {
//       console.log(`Listening`);
//     }).on('online', () => {
//       console.log(`Online`);
//     });;
//   }

//   cluster.on("exit", (worker) => {
//     console.log(`Worker ${worker.process.pid} died`);
//     cluster.fork();
//   });
// } else {
//   console.log(`Worker ${process.pid} started`);

//   // const server = require('https').createServer(options, app);
//   const io = require('socket.io')(server, {
//     cors: {
//       origin: '*',
//     }
//   });

//   io.adapter(redisAdapter({ host: "localhost", port: 6379 }));
//   // setupWorker(io);

//   const clientSockets = {};

//   io.on('connection', (socket) =>{
//     console.log(`Connecté au client ${socket.id}`)
//     socket.emit("sendId", {id: socket.id});
//     clientSockets[socket.id] = socket;
 
//     // -------------------------- LISTENERS
 
//      // Rejoindre une partie
//      socket.on('join', (payload) =>{
//          console.log(`Join ${payload.receiverId}`)
//          const player1socket = clientSockets[payload.receiverId]
//          if(player1socket){
//           player1socket.emit("join", payload);
//          }
//      })
 
//        // Jouer un coup
//        socket.on('playPush', (payload) =>{
//          console.log(`Played push ${payload.positionIndex}`)
//          const player1socket = clientSockets[payload.receiverId]
//          if(player1socket){
//           player1socket.emit("playPush", payload);
//          }
//      })
 
//        // Envoyer un coup réussi
//        socket.on('successHit', (payload) => {
//          console.log(`Success hit to ${payload.receiverId}`)
//          const player2socket = clientSockets[payload.receiverId]
//          if(player2socket){
//           player2socket.emit("successHit", payload);
//          }
//      })
//  })

//    server.listen(443, () => {
//     console.log(`${process.pid} running on port 443`);
//   });

// }

// FIN

// // ------ Ajout de socket.io
// const io = require('socket.io')(server, {
//   cors: {
//     origin: '*',
//   }
// });

// const clientSockets = {};

// // Etablissement de la connexion d'un client
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


// // Ecoute du port HTTPS
// server.listen(443, () => {
//     console.log('HTTPS Server running on port 443');
// });