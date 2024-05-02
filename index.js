const express = require('express')
const app = express()

const { Server } = require('socket.io'); 
const http = require('http'); 
const server = http.createServer(app); 
const io = new Server(server); 

const port = 3000
// For Deployment
// server.listen(process.env.PORT, process.env.IP, () => {console.log("Server is Running...")})
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

        temp_db[session_id]['player_black'] = 1

        io.to(`${session_id}`).emit('join session', temp_db[session_id])

    })

    socket.on('submit', (game_data) => {

        console.log("recieved data")

        temp_db[game_data.session_id] = game_data

        check_winner(game_data)

        io.to(`${temp_db[game_data.session_id]['session_id']}`).emit('submit', temp_db[game_data.session_id])

    })

    socket.on('rematch', (game_data) => {

        console.log("Rematch request submitted")

        temp_db[game_data.session_id] = game_data

        io.to(`${temp_db[game_data.session_id]['session_id']}`).emit('rematch', temp_db[game_data.session_id])

    })

    socket.on('leave', (session_id) => {

        socket.leave(session_id)

    })

    socket.on('disconnect', () => {

    })

})

app.get('/valid_id/:id', (req, res) => {
    id = req.params.id

    if (id in temp_db && temp_db[id]['player_black'] != 1) {
        res.send(true)
    } else {
        res.send(false)
    }
});

function check_winner(game_data) {

    const board = game_data['board']

    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {

            if (board[i][j] != 0) {

                const col = board[i][j]
                const right = check_right(board, i, j + 1, col)
                const diag = check_diag(board, i + 1, j + 1, col)
                const down = check_down(board, i + 1, j, col)

                if (right >= 5 || diag >= 5 || down >= 5) {
                    console.log(`Winner found: ${col}`)
                    game_data['winner'] = col
                }
            }
        }
    }
}

function check_right(board, i, j, col) {
    let res = 0
    if (i < 15 && j < 15 && board[i][j] == col) {
        res = check_right(board, i, j + 1, col)
    }
    return res + 1
}

function check_diag(board, i, j, col) {
    let res = 0
    if (i < 15 && j < 15 && board[i][j] == col) {
        res = check_diag(board, i + 1, j + 1, col)
    }
    return res + 1
}

function check_down(board, i, j, col) {
    let res = 0
    if (i < 15 && j < 15 && board[i][j] == col) {
        res = check_down(board, i + 1, j, col)
    }
    return res + 1
}
