const join = document.getElementById('join-btn')
const join_input = document.getElementById('join-id')
const newgame = document.getElementById('new-game-btn')
const board = document.getElementById('board')
const submit_move = document.getElementById('submit-move')

const home_screen = document.getElementById('home-screen')
const game_screen = document.getElementById('game-screen')

const socket = io();

let user_colour
let game_data
let turn_data = {placed_tile: false}

const temp = document.getElementById('temp')
temp.addEventListener('click', () => {

    if (home_screen.classList.contains("hidden")) {
        home_screen.classList.remove("hidden")
        game_screen.classList.add("hidden")
    } else {
        home_screen.classList.add("hidden")
        game_screen.classList.remove("hidden")
    }

})

join.addEventListener('click', () => join_game())
newgame.addEventListener('click', () => create_new_game())
submit_move.addEventListener('click', () => submit())

function create_new_game() {

    user_colour = 1
    // Merge this into turn_data

    const session_id = gen_session_id()
    console.log(`Session created with id ${session_id}`)
    
    let board = []
    for (let i = 0; i < 15; i++) {
        board.push([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
    }

    // We are setting 0 as no piece, 1 as white piece, -1 as black piece
    game_data = {
        board: board,
        turn: -1,
        session_id: session_id
    }
    
    socket.emit('create session', game_data)

    initialize_game(game_data)

}

async function join_game() {
    
    user_colour = -1
    session_id = join_input.value

    // Checks if session exists or not
    if (session_id == '') {
        console.log("Invalid Session Id, Please Try Again")
        return
    }

    const resp = await fetch(`/valid_id/${session_id}`)
    const is_valid = await resp.json()

    if (is_valid) {
        socket.emit('join session', session_id)
        
        socket.on('join session', (data) => {
            
            game_data = data
            console.log(game_data)
            initialize_game()
        })
    } else {
        console.log("Invalid Session Id, Please Try Again")
        return
        // Show something on front-end ig, popup text
    }   

}

function submit() {

    if (turn_data['placed_tile'] == true) {
        
        if (game_data.turn == 1) {
            game_data.turn = -1
        } else {
            game_data.turn = 1
        }

        turn_data['placed_tile'] = false

        socket.emit('submit', game_data)
        console.log("Move has been submitted")
    }

}

socket.on('submit', (data) => {
    
    console.log("Data recieved")

    game_data = data

    redisplay_pieces()
})

function initialize_game() {

    home_screen.classList.add("hidden")
    game_screen.classList.remove("hidden")

    board.innerHTML = ''
    console.log("Loading Board...")

    // Creating the tiles for the board
    for (let i = 1; i <= 15; i++) {
        for (let j = 1; j <= 15; j++) {
            const square = document.createElement('div')
            square.setAttribute('data-row', i)
            square.setAttribute('data-column', j)
            square.id = `${i}-${j}`
            square.className = "w-full h-full"

            square.addEventListener('click', e => tile_clicked(e))

            board.append(square)
        }
    }

    redisplay_pieces()
    
}

function tile_clicked(e) {

    const clicked_tile = e.target
    const row = clicked_tile.dataset.row
    const col = clicked_tile.dataset.column

    console.log("Row:", row, "Column:", col)
    // const tile = document.getElementById(`${clicked_tile.dataset.row}-${clicked_tile.dataset.column}`)

    if (game_data.turn != user_colour || game_data.board[row - 1][col - 1] != 0) {
        return
    } else {

        game_data.board[row - 1][col - 1] = user_colour
        
        place_tile(row, col, user_colour)

        if (turn_data['placed_tile'] == true) {
            // console.log("Previous tile placed, removing it ...")
            remove_title(turn_data['prev_row'], turn_data['prev_col'], user_colour)
        }

        turn_data['placed_tile'] = true
        turn_data["prev_row"] = row
        turn_data["prev_col"] = col

    }

}

function redisplay_pieces() {

    // Load existing pieces from game_data
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            if (game_data.board[i][j] == 1) {
                place_tile(i + 1, j + 1, 1)
            } else if (game_data.board[i][j] == -1) {
                place_tile(i + 1, j + 1, -1)
            }
        }
    }
}

function place_tile(row, column, col) {

    const tile = document.getElementById(`${row}-${column}`)

    // Replace with actual pieces later
    if (col == -1) {
        tile.classList.add('bg-black')
        // tile.classList.add('tile-black bg-black')
    } else {
        tile.classList.add('bg-white')
        // tile.classList.add('tile-white bg-white')
    }
}

function remove_title(row, column, col) {
    
    const tile = document.getElementById(`${row}-${column}`)

    game_data.board[row - 1][column - 1] = 0

    if (col == '-1') {
        tile.classList.remove('bg-black')
        // tile.classList.add('tile-black bg-black')
    } else {
        tile.classList.remove('bg-white')
        // tile.classList.add('tile-white bg-white')
    }
}

function gen_session_id() {
    const length = 5

    let text = '';
    const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}