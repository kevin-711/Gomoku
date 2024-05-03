const express = require('express')
const app = express()

require('dotenv').config()

const { Server } = require('socket.io'); 
const http = require('http'); 
const server = http.createServer(app); 
const io = new Server(server); 

const { MongoClient } = require('mongodb');
// const url = 'mongodb+srv://kevthekat888:faWA0XpGs5rT1kkx@cluster0.vnp6tvb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
const url = process.env.MONGO_URL
const client = new MongoClient(url);

const port = 3000
// For Deployment
// server.listen(process.env.PORT, process.env.IP, () => {console.log("Server is Running...")})
server.listen(port, () => {console.log("Server is Running...")})
app.use(express.static('public'))
app.use(express.json({limit: '1mb'}))

const db = client.db('gomoku_data')
const game_data_col = db.collection('game_data')


io.on('connection', (socket) => {

    socket.on('create session', async (game_data) => {

        const session_id = game_data['session_id']

        socket.join(session_id)
        
        await game_data_col.insertOne(game_data)

    })

    socket.on('join session', async (session_id) => {

        socket.join(session_id)

        console.log(`User with id ${socket.id} joined a session ${session_id}`)

        const query = {session_id: `${session_id}`}
        const update_document = {
            $set: {
                player_black: 1
            }
        }

        await game_data_col.updateOne(query, update_document)
        const game_data = await game_data_col.findOne(query)
        delete game_data._id

        io.to(`${session_id}`).emit('join session', game_data)

    })

    socket.on('submit', async (game_data) => {

        // console.log("recieved data")

        const query = {session_id: `${game_data.session_id}`}

        await game_data_col.replaceOne(query, game_data)
        
        check_winner(game_data)

        io.to(`${game_data.session_id}`).emit('submit', game_data)

    })

    socket.on('rematch', async (game_data) => {

        console.log("Rematch request submitted")

        const query = {session_id: `${game_data.session_id}`}
        await game_data_col.replaceOne(query, game_data)

        io.to(`${game_data.session_id}`).emit('rematch', game_data)

    })

    socket.on('leave', (session_id) => {

        socket.leave(session_id)

    })

    socket.on('disconnect', () => {

    })

})

app.get('/valid_id/:id', async (req, res) => {
    id = req.params.id

    const query = {session_id: `${id}`}
    const game_data = await game_data_col.findOne(query)

    if (game_data != null && game_data.player_black != 1) {
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
                const diag1 = check_diag1(board, i + 1, j + 1, col)
                const diag2 = check_diag2(board, i - 1, j + 1, col)
                const down = check_down(board, i + 1, j, col)

                if (right >= 5 || diag1 >= 5 || diag2 >= 5 || down >= 5) {
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

function check_diag1(board, i, j, col) {
    let res = 0
    if (i < 15 && j < 15 && board[i][j] == col) {
        res = check_diag1(board, i + 1, j + 1, col)
    }
    return res + 1
}

function check_diag2(board, i, j, col) {
    let res = 0
    if (i < 15 && j < 15 && board[i][j] == col) {
        res = check_diag2(board, i - 1, j + 1, col)
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
