const express = require('express')
const app = express()

const { Server } = require('socket.io'); 
const http = require('http'); 
const server = http.createServer(app); 
const io = new Server(server); 

const port = 3000
server.listen(port, () => {console.log("Server is Running...")})
app.use(express.static('public'))
app.use(express.json({limit: '1mb'}))

temp_db = {}

io.on('connection', (socket) => {

    socket.on('create session', (game_data) => {

        const session_id = game_data['session_id']

        socket.join(session_id)
        
        temp_db[session_id] = game_data
        console.log(`User with id ${socket.id} created a session ${session_id}`)
    })

    socket.on('join session', (session_id) => {

        socket.join(session_id)

        console.log(`User with id ${socket.id} joined a session ${session_id}`)

        io.to(`${session_id}`).emit('join session', temp_db[session_id])

    })

    socket.on('submit', (game_data) => {

        console.log("recieved data")

        io.to(`${game_data['session_id']}`).emit('submit', game_data)

    })

})

app.get('/valid_id/:id', (req, res) => {
    id = req.params.id

    if (id in temp_db) {
        res.send(true)
    } else {
        res.send(false)
    }
});



