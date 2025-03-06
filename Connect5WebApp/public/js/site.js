const columns = document.querySelectorAll(".column");

let oddPlayer = true;
let eventText = document.getElementById("eventText");

let winPhase = 0;

let p1Btn = document.getElementById('p1powerup');
let p2Btn = document.getElementById('p2powerup');
let p1Btn2 = document.getElementById('p1powerup2');
let p2Btn2 = document.getElementById('p2powerup2');
let resetbutton = document.getElementById('resetbutton');

let aiPredict = document.getElementById('predict');

let p1Ab = "";
let p2Ab = "";
let p1Ab2 = "";
let p2Ab2 = "";
let currentPowerUp = "";

let gameData = [];

resetbutton.innerHTML = `<button onclick="resetAb()">Reset</button>`;
let rand = Math.floor(Math.random() * 5);

if (rand == 0) {
    p1Ab = "Stone";
    p1Btn2.innerHTML = `<button onclick="useStone()">Stone (P1)</button>`;

    p1Ab2 = "Double";
    p1Btn.innerHTML = `<button onclick="useStone()">Double Place (P1)</button>`;

    p2Ab = "Double";
    p2Btn2.innerHTML = `<button onclick="useDouble()">Double Place (P2)</button>`;

    p2Ab2 = "Stone";
    p2Btn.innerHTML = `<button onclick="useDouble()">Stone (P2)</button>`;
    
} else if(rand == 1) {

    p1Ab = "Double";
    p1Btn.innerHTML = `<button onclick="useDouble()">Double Place (P1)</button>`;

    p1Ab2 = "Double";
    p1Btn2.innerHTML = `<button onclick="useDouble()">Double Place (P1)</button>`;

    p2Ab = "Stone";
    p2Btn.innerHTML = `<button onclick="useStone()">Stone (P2)</button>`;

    p2Ab2 = "Stone";
    p2Btn2.innerHTML = `<button onclick="useStone()">Stone (P2)</button>`;

} else {
    p1Ab = "Double";
    p1Btn.innerHTML = `<button onclick="useDouble()">Double Place (P1)</button>`;

    p2Ab = "Stone";
    p2Btn.innerHTML = `<button onclick="useStone()">Stone (P2)</button>`;
}

function resetAb() {
    currentPowerUp = "";
    console.log("Reset Power-Up");
}

function useDouble() {
    if (p1Ab == "Double" && oddPlayer || p2Ab == "Double" && !oddPlayer) {
        currentPowerUp = "Double";
        console.log("Power Up Double Activated!")
    } else {
        console.log("Invalid Turn.")
    }
}

function useStone() {
    if (p1Ab == "Stone" && oddPlayer || p2Ab == "Stone" && !oddPlayer) {
        currentPowerUp = "Stone";
        console.log("Power Up Stone Activated!")
    } else {
        console.log("Invalid Turn.")
    }
}

columns.forEach((column, columnIndex) => {
    column.addEventListener("click", () => {
        handleColumnClick(columnIndex);

        /* 
        Fix for the Hovering not working after a click
        A new event has to be instantiated to trigger the event listener
        */

        const mouseOverEvent = new Event("mouseover");
        column.dispatchEvent(mouseOverEvent);
    });

    column.addEventListener("mouseover", () => handleColumnHover(columnIndex));
    column.addEventListener("mouseout", () => handleColumnRelease(columnIndex));
});

// This is the function to handle the column clicks.
function handleColumnClick(columnIndex) {
    if (winPhase > 0) return;

    //-- This here is for the game to save data in JSON

    // Capture board state before move
    const boardState = getBoardState(); // Function to get board array

    // Record the move
    const moveData = {
        board: JSON.parse(JSON.stringify(boardState)), // Deep copy to avoid mutations
        move: columnIndex,
        player: oddPlayer ? "p1" : "p2",
        powerUp: currentPowerUp || null
    };

    gameData.push(moveData); // Store move in dataset

    //-- The save data code ends here

    /*
    https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-child

    Razor Language Because This Line Was Horrible To Deal With

    - Query the document and select all the divs that have the "column" class attached to it
    - Find the nth child of the class, and add one on top of the index as index uses zero-based counting instead of natural numbers 
    - Get the cell classes as the children

    (May or may not have explained it awfully)

    Cell has to be spaced or else it doesn't work. Guessing it's because of CSS syntax but will have to look into more as it's a wild guess.

    Also this line gets mad if I try to declare it beforehand.
    */
    const columnCells = document.querySelectorAll(`.column:nth-child(${columnIndex + 1}) .cell`);

    for (let i = (columnCells.length - 1); i >= 0; i--) {
        if (columnCells[i].classList.contains("playable")) {
            columnCells[i].classList.remove("playable");

            if (columnCells[i - 1] != (null || undefined)) {
                columnCells[i - 1].classList.add("playable");
            }

            console.log(columnIndex)
            if (currentPowerUp == "Stone") {
                columnCells[i].classList.add("stone");
                currentPowerUp = "";

                if (p1Ab == "Stone") {
                    p1Ab = "";
                    p1Btn.innerHTML = "";
                } else {
                    p2Ab = "";
                    p2Btn.innerHTML = "";
                }

            } 
            else if (currentPowerUp == "Double") {
                if (oddPlayer) {
                    columnCells[i].classList.add("p1");
                    p1Ab = "";
                    p1Btn.innerHTML = "";
                } else {
                    columnCells[i].classList.add("p2");
                    p2Ab = "";
                    p2Btn.innerHTML = "";
                }

                currentPowerUp = "";
                checkWin();
                break;
            }
            else if (oddPlayer) {
                columnCells[i].classList.add("p1");
            } else {
                columnCells[i].classList.add("p2");
            }   

            oddPlayer = !oddPlayer;

            checkWin();
            break;
        }
    }
}

// This function is to handle hovering over a column
function handleColumnHover(columnIndex) {
    if (winPhase > 0) return;

    const columnCells = document.querySelectorAll(`.column:nth-child(${columnIndex + 1}) .cell`);

    for (let i = (columnCells.length - 1); i >= 0; i--) {
        if (columnCells[i].classList.contains("playable")) {
            if (currentPowerUp == "Stone") {
                columnCells[i].classList.add("stone");
            }
            else if (oddPlayer) {
                columnCells[i].classList.add("p1");
            } else {
                columnCells[i].classList.add("p2");
            }
        }
    }
}

// This function is to handle when the mouse cursor exits the column
function handleColumnRelease(columnIndex) {
    if (winPhase > 0) return;

    const columnCells = document.querySelectorAll(`.column:nth-child(${columnIndex + 1}) .cell`);

    for (let i = (columnCells.length - 1); i >= 0; i--) {
        if (columnCells[i].classList.contains("playable")) {
            if (currentPowerUp == "Stone") {
                columnCells[i].classList.remove("stone");
            }
            else if (oddPlayer) {
                columnCells[i].classList.remove("p1");
            } else {
                columnCells[i].classList.remove("p2");
            }
        }
    }
}

//These Functions handle win condition and phase

function getBoardState() {
    const rows = 6;  // Adjust based on your grid size
    const cols = 7;  // Adjust based on your grid size
    let board = Array.from({ length: rows }, () => Array(cols).fill(null));

    document.querySelectorAll(".column").forEach((column, colIndex) => {
        const cells = column.querySelectorAll(".cell");
        for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
            if (cells[rowIndex].classList.contains("p1")) {
                board[rowIndex][colIndex] = "p1";
            } else if (cells[rowIndex].classList.contains("p2")) {
                board[rowIndex][colIndex] = "p2";
            } else if (cells[rowIndex].classList.contains("stone")) {
                board[rowIndex][colIndex] = "stone";
            }
        }
    });


    //  console.log(board[rowIndex][colIndex]);


    console.log("Board", board)
    return board;
}

function checkWin() {
    const board = getBoardState();
    const rows = board.length;
    const cols = board[0].length;

    console.log("p1Ab:", p1Ab, "p2Ab:", p2Ab, "resetbutton:", resetbutton);
    if (p1Ab == "" && p2Ab == "") {
        resetbutton.style.display = "none";
    }

    function isWinningMove(row, col, player) {
        if (!player) return false;

        // Direction vectors [row direction, column direction]
        const directions = [
            [0, 1],  // Horizontal →
            [1, 0],  // Vertical ↓
            [1, 1],  // Diagonal ↘
            [1, -1]  // Diagonal ↙
        ];

        for (let [dx, dy] of directions) {
            let count = 1;

                // Check in one direction
                for (let i = 1; i < 5; i++) {
                    let newRow = row + dx * i;
                    let newCol = col + dy * i;
                    //if (board[newRow][newCol] === "stone") break;
                    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && board[newRow][newCol] === player) {
                        count++;
                    } else break;
                }

                // Check in the opposite direction
                for (let i = 1; i < 5; i++) {
                let newRow = row - dx * i;
                let newCol = col - dy * i;
                //if (board[newRow][newCol] === "stone") break;
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && board[newRow][newCol] === player) {
                    count++;
                } else break;
            }

            if (count >= 5){
                saveGameData();
                return true;
            }
        }

        return false;
    }

    // Loop through the board to find the last placed piece
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col] && isWinningMove(row, col, board[row][col])) {
                winPhase = 1;
                eventText.innerText = `${board[row][col]} wins!`;
                let winner = board[row][col];
                setTimeout(() => {
                window.location.href = `/win?winner=${winner}`;
            }, 2000);
                 // Redirect after a 2-second delay
                return;
            }
        }
    }
}

// Function to download JSON file
function saveGameData() {
    const jsonData = JSON.stringify(gameData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "game_data.json";
    a.click();
}

async function loadModel() {
    // Load the ONNX model
    const session = await ort.InferenceSession.create("connect5_model.onnx");

    // Example input (random board state)
    const inputTensor = new ort.Tensor("float32", new Float32Array(44), [1, 44]);

    // Run the model
    const outputs = await session.run({ input: inputTensor });
    
    // Get predicted move (highest probability column)
    const moveProbabilities = outputs.output.data;
    const bestMove = moveProbabilities.indexOf(Math.max(...moveProbabilities));

    aiPredict.innerText("Best move:", bestMove);
}

loadModel();
