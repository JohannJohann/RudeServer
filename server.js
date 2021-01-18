const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
app.use(cors())

// ajout de socket.io
const server = require('http').Server(app)
const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
  });

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))
app.get('/', function (req, res) {
   res.sendFile('index.html', { root: __dirname })
})

const clientSockets = {};

// Etablissement de la connexion d'un client
io.on('connection', (socket) =>{
   console.log(`Connecté au client ${socket.id}`)
   socket.emit("sendId", {id: socket.id});
   clientSockets[socket.id] = socket;

   // -------------------------- LISTENERS

    // Rejoindre une partie
    socket.on('join', (payload) =>{
        console.log(`Join ${payload.receiverId}`)
        const player1socket = clientSockets[payload.receiverId]
        player1socket.emit("join", payload);
    })

      // Jouer un coup
      socket.on('playPush', (payload) =>{
        console.log(`Played push ${payload.positionIndex}`)
        const player1socket = clientSockets[payload.receiverId]
        player1socket.emit("playPush", payload);
    })

      // Envoyer un coup réussi
      socket.on('successHit', (payload) => {
        console.log(`Success hit to ${payload.receiverId}`)
        const player2socket = clientSockets[payload.receiverId]
        player2socket.emit("successHit", payload);
    })
})


 

// on change app par server
server.listen(3030, function () {
 console.log('Votre app est disponible sur localhost:3030 !')
})