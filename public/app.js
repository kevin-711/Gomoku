const join = document.getElementById('join-btn')
const join_input = document.getElementById('join-id')
const newgame = document.getElementById('new-game-btn')
const board = document.getElementById('board')
const submit_move = document.getElementById('submit-move')
const turn_ind = document.getElementById('turn-ind')
const id_disp = document.getElementById('id')
const home_btn = document.getElementById('home')
const rematch_btn = document.getElementById('rematch')
const game_end = document.getElementById('game-end')
const instr = document.getElementById('instr')
const copy_msg = document.getElementById('copy-msg')
const invalid_msg = document.getElementById('invalid-msg')

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

    const session_id = gen_session_id()
    console.log(`Session created with id ${session_id}`)
    
    initialize_data(session_id, 1)
    
    socket.emit('create session', game_data)
    
    turn_ind.textContent = "Opponent's Turn"
    initialize_game()
    
}

async function join_game() {
    
    session_id = join_input.value
    join_input.value = ''

    initialize_data(session_id, -1)

    // Checks if session exists or not
    if (session_id == '') {
        invalid_msg.classList.remove('out-of-frame')

        setInterval(() => {
            invalid_msg.classList.add('out-of-frame')
        }, 3000);

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
        invalid_msg.classList.remove('out-of-frame')

        setInterval(() => {
            invalid_msg.classList.add('out-of-frame')
        }, 3000);

        return
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
        game_end.classList.remove('hidden')
        submit_move.classList.add('hidden')
        return
    } else if (game_data['winner'] != 0) {
        turn_ind.textContent = "Defeat"
        game_end.classList.remove('hidden')
        submit_move.classList.add('hidden')
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
    game_end.classList.add('hidden')
    submit_move.classList.remove('hidden')

    socket.emit('leave session', game_data['session_id'])

}

function rematch() {

    game_data['rematch'] += 1
    
    rematch_btn.disabled = true

    socket.emit('rematch', game_data)
}

socket.on('rematch', (data) => {

    console.log("Rematch request recieved from socket")
    console.log(data)

    game_data = data

    if (game_data['rematch'] == 1) {
        rematch_btn.textContent = 'Rematch (1/2)'
    } else if (game_data['rematch'] > 1) {

        console.log("Initiating Rematch")

        initialize_data(game_data['session_id'], turn_data['user_colour'])

        socket.emit('submit', game_data)

        initialize_game()
        
        rematch_btn.textContent = 'Rematch (0/2)'
        game_end.classList.add('hidden')
        submit_move.classList.remove('hidden')
    }

})

function initialize_game() {

    home_screen.classList.add("hidden")
    game_screen.classList.remove("hidden")

    id_disp.textContent = `Game ID: ${game_data['session_id']}`
    id_disp.addEventListener('click', () => copy_id())

    rematch_btn.disabled = false

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

function initialize_data(session_id, col) {

    // Creating a blank board
    let board = []
    for (let i = 0; i < 15; i++) {
        board.push([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
    }
    // We are setting 0 as no piece, 1 as white piece, -1 as black piece for board
    // Following similar indicators for turn and winner
    game_data = {
        board: board,
        turn: -1,
        session_id: session_id,
        winner: 0,
        player_black: 0,
        player_white: 1,
        rematch: 0
    }

    turn_data = {
        placed_tile: false,
        prev_col: "",
        prev_row: "",
        user_colour: col
    }
}

function tile_clicked(e) {

    const clicked_tile = e.target
    const row = clicked_tile.dataset.row
    const col = clicked_tile.dataset.column
    const user_colour = turn_data['user_colour']

    // Check if tile is valid for placement
    if (game_data.turn != user_colour || game_data.board[row - 1][col - 1] != 0) {
        return
    } else {
        game_data.board[row - 1][col - 1] = user_colour
        place_tile(row, col, user_colour)

        if (turn_data['placed_tile'] == true) {
            // console.log("Previous tile placed, removing it ...")
            remove_title(turn_data['prev_row'], turn_data['prev_col'], user_colour)
        }

        // Update turn data
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

// Copying session id and managing popups
async function copy_id() {
    try {
        await navigator.clipboard.writeText(game_data['session_id']);
        console.log("Copied")
        
        copy_msg.classList.remove('out-of-frame')

        setInterval(() => {
            copy_msg.classList.add('out-of-frame')
        }, 3000)
        
    } catch (err) {
        console.error('Error in copying text: ', err);
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