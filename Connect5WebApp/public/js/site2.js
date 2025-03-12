const ort = require('onnxruntime-web');

const columns = document.querySelectorAll(".column");

let oddPlayer = true;
let eventText = document.getElementById("eventText");

let winPhase = 0;

let p1Btn = document.getElementById('p1powerup');
let p2Btn = document.getElementById('p2powerup');
let resetbutton = document.getElementById('resetbutton');

let aiPredict = document.getElementById('predict');

let p1Ab = "";
let p2Ab = "";
let currentPowerUp = "";

let gameData = [];

let session;
window.addEventListener("load", loadModel);

resetbutton.innerHTML = `<button onclick="resetAb()">Reset Power-Up</button>`;
let rand = Math.floor(Math.random() * 5);

if (rand == 0) {
    p1Ab = "Stone";
    p1Btn.innerHTML = `<button onclick="useStone()">Stone (P1)</button>`;

    p2Ab = "Double";
    p2Btn.innerHTML = `<button onclick="useDouble()">Double Place (P2)</button>`;
} else if(rand == 1) {
    p1Ab = "Double";
    p1Btn.innerHTML = `<button onclick="useDouble()">Double Place (P1)</button>`;

    p2Ab = "Stone";
    p2Btn.innerHTML = `<button onclick="useStone()">Stone (P2)</button>`;
} else {
    p1Ab = "Double";
    p1Btn.innerHTML = `<button onclick="useDouble()">Double Place (P1)</button>`;

    p2Ab = "Double";
    p2Btn.innerHTML = `<button onclick="useDouble()">Double Place (P2)</button>`;
}

function resetAb() {
    currentPowerUp = "";
    console.log("Reset Power-Up");
}

function useDouble() {
    console.log("useDouble called");
    if (p1Ab == "Double" && oddPlayer || p2Ab == "Double" && !oddPlayer) {
        currentPowerUp = "Double";
        console.log("Power Up Double Activated!");
    } else {
        console.log("Invalid Turn.");
    }
}

function useStone() {
    console.log("useStone called");
    if (p1Ab == "Stone" && oddPlayer || p2Ab == "Stone" && !oddPlayer) {
        currentPowerUp = "Stone";
        console.log("Power Up Stone Activated!");
    } else {
        console.log("Invalid Turn.");
    }
}

columns.forEach((column, columnIndex) => {
    column.addEventListener("click", () => {
        handleColumnClick(columnIndex);
        const mouseOverEvent = new Event("mouseover");
        column.dispatchEvent(mouseOverEvent);
    });

    column.addEventListener("mouseover", () => handleColumnHover(columnIndex));
    column.addEventListener("mouseout", () => handleColumnRelease(columnIndex));
});

function handleColumnClick(columnIndex) {
    if (winPhase > 0) return;

    const boardState = getBoardState();
    const moveData = {
        board: JSON.parse(JSON.stringify(boardState)),
        move: columnIndex,
    };
    gameData.push(moveData);

    const columnCells = document.querySelectorAll(`.column:nth-child(${columnIndex + 1}) .cell`);

    for (let i = (columnCells.length - 1); i >= 0; i--) {
        if (columnCells[i].classList.contains("playable")) {
            columnCells[i].classList.remove("playable");

            if (columnCells[i - 1] != (null || undefined)) {
                columnCells[i - 1].classList.add("playable");
            }

            if (currentPowerUp == "Stone") {
                columnCells[i].classList.add("stone");
                currentPowerUp = "";
                console.log("Stone power-up applied at row " + i);
                if (p1Ab == "Stone") {
                    p1Ab = "";
                    p1Btn.innerHTML = "";
                } else {
                    p2Ab = "";
                    p2Btn.innerHTML = "";
                }

            } else if (currentPowerUp == "Double") {
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

            updateAIPrediction();

            break;
        }
    }
}

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

function getFlattenedBoard() {
    console.log("getFlattenedBoard called");
    const board = getBoardState();
    return board.flat();
}

function getBoardState() {
    console.log("getBoardState called");
    const board = [];
    const columns = document.querySelectorAll(".column");

    columns.forEach((column, colIndex) => {
        let colState = [];
        column.querySelectorAll(".cell").forEach((cell, rowIndex) => {
            if (rowIndex < 6) {
                if (cell.classList.contains("p1")) colState.push(1);
                else if (cell.classList.contains("p2")) colState.push(-1);
                else if (cell.classList.contains("stone")) colState.push(2);
                else colState.push(0);
            }
        });
        board.push(colState);
    });

    console.log(`Board State: ${JSON.stringify(board)}`);
    return board;
}

function checkWin() {
    const board = getBoardState();
    const rows = board.length;
    const cols = board[0].length;

    function isWinningMove(row, col, player) {
        if (!player) return false;
        const directions = [
            [0, 1],  
            [1, 0],  
            [1, 1],  
            [1, -1]  
        ];

        for (let [dx, dy] of directions) {
            let count = 1;

            for (let i = 1; i < 5; i++) {
                let newRow = row + dx * i;
                let newCol = col + dy * i;
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && board[newRow][newCol] === player) {
                    count++;
                } else break;
            }

            for (let i = 1; i < 5; i++) {
                let newRow = row - dx * i;
                let newCol = col - dy * i;
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && board[newRow][newCol] === player) {
                    count++;
                } else break;
            }

            if (count >= 5) {
                saveGameData();
                console.log(`Winning move detected for player ${player}`);
                winPhase = 1;
                eventText.innerText = `${player} wins!`;
                let winner = player;
                setTimeout(() => {
                    window.location.href = `/win?winner=${winner}`;
                }, 2000);
                return true;
            }
        }
        return false;
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col] && isWinningMove(row, col, board[row][col])) {
                return;
            }
        }
    }
}

function saveGameData() {
    console.log("Saving game data...");
    const jsonData = JSON.stringify(gameData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "game_data.json";
    a.click();
}

async function loadModel() {
    console.log("Loading AI Model...");
    try {
        session = await ort.InferenceSession.create("model.onnx");
        console.log("AI Model Loaded Successfully");
    } catch (err) {
        console.error("Failed to load AI model:", err);
    }
}

async function getAIMove() {
    console.log("getAIMove called");
    if (!session) {
        console.error("AI Model not loaded");
        return;
    }
    // Add code to interact with the AI model here
}