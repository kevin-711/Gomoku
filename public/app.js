const join = document.getElementById('join-btn')
const join_input = document.getElementById('join-id')
const newgame = document.getElementById('new-game-btn')
const board = document.getElementById('board')
const submit_move = document.getElementById('submit-move')
const turn_ind = document.getElementById('turn-ind')
const id_disp = document.getElementById('id')
const home_btn = document.getElementById('home')
const rematch_btn = document.getElementById('rematch')

const home_screen = document.getElementById('home-screen')
const game_screen = document.getElementById('game-screen')

const socket = io();

let game_data
let turn_data = {placed_tile: false}

join.addEventListener('click', () => join_game())
newgame.addEventListener('click', () => create_new_game())
submit_move.addEventListener('click', () => submit())
home_btn.addEventListener('click', () => home())
rematch_btn.addEventListener('click', () => rematch())

function create_new_game() {

    turn_data['user_colour'] = 1

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
        session_id: session_id,
        winner: 0
    }
    
    socket.emit('create session', game_data)

    turn_ind.textContent = "Opponent's Turn"
    initialize_game(game_data)

}

async function join_game() {
    
    turn_data['user_colour'] = -1
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
            turn_ind.textContent = "Your Turn"
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
        // console.log("Move has been submitted")
    }

}

socket.on('submit', (data) => {
    
    game_data = data
    
    redisplay_pieces()
    
    if (game_data['winner'] == turn_data['user_colour']) {
        turn_ind.textContent = "You Won!"
        return
    } else if (game_data['winner'] != 0) {
        turn_ind.textContent = "Defeat"
        return
    }

    if (game_data['turn'] == turn_data['user_colour']) {
        turn_ind.textContent = "Your Turn"
    } else {
        turn_ind.textContent = "Opponent's Turn"
    }

})

function home() {

    home_screen.classList.remove("hidden")
    game_screen.classList.add("hidden")

}

function rematch() {

    

}

function initialize_game() {

    home_screen.classList.add("hidden")
    game_screen.classList.remove("hidden")

    id_disp.textContent = `Game ID: ${game_data['session_id']}`

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
    const user_colour = turn_data['user_colour']

    // console.log("Row:", row, "Column:", col)
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

    if (col == -1) {
        tile.classList.add('tile-black')
        tile.classList.add('bg-contain')
    } else {
        tile.classList.add('tile-white')
        tile.classList.add('bg-contain')
    }
}

function remove_title(row, column, col) {
    
    const tile = document.getElementById(`${row}-${column}`)
    game_data.board[row - 1][column - 1] = 0
    
    if (col == '-1') {
        tile.classList.remove('tile-black')
    } else {
        tile.classList.remove('tile-white')
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