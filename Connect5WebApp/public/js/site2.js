// 1. Remove the 'require' line as it crashes the browser. 
// The 'ort' object is already provided by your HTML script tag.

let oddPlayer = true;
let winPhase = 0;
let p1Ab = "";
let p2Ab = "";
let currentPowerUp = "";
let gameData = [];
let session;

// Wait for the HTML to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
    // Select elements
    const boardContainer = document.getElementById("board");
    const eventText = document.getElementById("eventText");
    const p1Btn = document.getElementById('p1powerup');
    const p2Btn = document.getElementById('p2powerup');
    const resetContainer = document.getElementById('resetbutton');

    // 2. Generate the Grid
    if (boardContainer) {
        for (let c = 0; c < 7; c++) {
            const colDiv = document.createElement("div");
            colDiv.classList.add("column");
            for (let r = 0; r < 6; r++) {
                const cellDiv = document.createElement("div");
                cellDiv.classList.add("cell");
                if (r === 5) cellDiv.classList.add("playable");
                colDiv.appendChild(cellDiv);
            }
            boardContainer.appendChild(colDiv);
        }
    }

    // Now that columns exist, select them
    const columns = document.querySelectorAll(".column");

    // 3. Initialize Power-Ups
    resetContainer.innerHTML = `<button id="realResetBtn">Reset Power-Up</button>`;
    document.getElementById("realResetBtn").onclick = resetAb;

    let rand = Math.floor(Math.random() * 3);
    if (rand == 0) {
        p1Ab = "Stone";
        p1Btn.innerHTML = `<button onclick="useStone()">Stone (P1)</button>`;
        p2Ab = "Double";
        p2Btn.innerHTML = `<button onclick="useDouble()">Double (P2)</button>`;
    } else if (rand == 1) {
        p1Ab = "Double";
        p1Btn.innerHTML = `<button onclick="useDouble()">Double (P1)</button>`;
        p2Ab = "Stone";
        p2Btn.innerHTML = `<button onclick="useStone()">Stone (P2)</button>`;
    } else {
        p1Ab = "Double";
        p1Btn.innerHTML = `<button onclick="useDouble()">Double (P1)</button>`;
        p2Ab = "Double";
        p2Btn.innerHTML = `<button onclick="useDouble()">Double (P2)</button>`;
    }

    // 4. Attach Event Listeners
    columns.forEach((column, columnIndex) => {
        column.addEventListener("click", () => handleColumnClick(columnIndex, columns, eventText, p1Btn, p2Btn));
        column.addEventListener("mouseover", () => handleColumnHover(columnIndex, columns));
        column.addEventListener("mouseout", () => handleColumnRelease(columnIndex, columns));
    });

    loadModel();
});

// --- HELPER FUNCTIONS ---

function resetAb() {
    currentPowerUp = "";
    console.log("Power-Up Reset");
}

window.useDouble = function () {
    if ((p1Ab === "Double" && oddPlayer) || (p2Ab === "Double" && !oddPlayer)) {
        currentPowerUp = "Double";
    }
};

window.useStone = function () {
    if ((p1Ab === "Stone" && oddPlayer) || (p2Ab === "Stone" && !oddPlayer)) {
        currentPowerUp = "Stone";
    }
};

function handleColumnClick(columnIndex, columns, eventText, p1Btn, p2Btn) {
    if (winPhase > 0) return;

    const columnCells = columns[columnIndex].querySelectorAll(".cell");
    for (let i = columnCells.length - 1; i >= 0; i--) {
        if (columnCells[i].classList.contains("playable")) {
            columnCells[i].classList.remove("playable");
            if (columnCells[i - 1]) columnCells[i - 1].classList.add("playable");

            if (currentPowerUp === "Stone") {
                columnCells[i].classList.add("stone");
                if (oddPlayer) { p1Ab = ""; p1Btn.innerHTML = ""; }
                else { p2Ab = ""; p2Btn.innerHTML = ""; }
                currentPowerUp = "";
            } else {
                columnCells[i].classList.add(oddPlayer ? "p1" : "p2");
                if (currentPowerUp === "Double") {
                    if (oddPlayer) { p1Ab = ""; p1Btn.innerHTML = ""; }
                    else { p2Ab = ""; p2Btn.innerHTML = ""; }
                    currentPowerUp = "";
                    checkWin(columns, eventText);
                    return; // Allow same player to move again
                }
            }

            oddPlayer = !oddPlayer;
            eventText.innerText = oddPlayer ? "Player 1's Turn" : "Player 2's Turn";
            checkWin(columns, eventText);
            break;
        }
    }
}

function handleColumnHover(columnIndex, columns) {
    const columnCells = columns[columnIndex].querySelectorAll(".cell");
    for (let i = columnCells.length - 1; i >= 0; i--) {
        if (columnCells[i].classList.contains("playable")) {
            columnCells[i].style.backgroundColor = "#444";
            break;
        }
    }
}

function handleColumnRelease(columnIndex, columns) {
    const columnCells = columns[columnIndex].querySelectorAll(".cell");
    columnCells.forEach(c => c.style.backgroundColor = "");
}

function checkWin(columns, eventText) {
    const rows = 6;
    const cols = 7;
    const winCondition = 5; // Setting for Connect 5
    const board = [];

    // Convert DOM state to a 2D array [col][row]
    columns.forEach(col => {
        let colData = [];
        col.querySelectorAll(".cell").forEach(cell => {
            if (cell.classList.contains("p1")) colData.push(1);
            else if (cell.classList.contains("p2")) colData.push(-1);
            else colData.push(0); // Includes stones and empty cells
        });
        board.push(colData);
    });

    // Check every cell as a potential starting point for a win
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const player = board[c][r];
            if (player === 0) continue; // Skip empty or stone cells

            // Directions to check: [dColumn, dRow]
            const directions = [
                [0, 1],  // Vertical
                [1, 0],  // Horizontal
                [1, 1],  // Diagonal (Down-Right)
                [1, -1]  // Diagonal (Up-Right)
            ];

            for (const [dc, dr] of directions) {
                let count = 1;

                // Check the next 4 pieces in this direction
                for (let i = 1; i < winCondition; i++) {
                    const nextC = c + (dc * i);
                    const nextR = r + (dr * i);

                    // Ensure the next cell is within board boundaries
                    if (nextC >= 0 && nextC < cols && nextR >= 0 && nextR < rows) {
                        if (board[nextC][nextR] === player) {
                            count++;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }

                if (count === winCondition) {
                    winPhase = 1;
                    const winner = (player === 1) ? "Player 1" : "Player 2";
                    eventText.innerText = `${winner} Wins! Redirecting in 10s...`;

                    // Optional: Start a countdown in the event text
                    let secondsLeft = 10;
                    const countdown = setInterval(() => {
                        secondsLeft--;
                        if (secondsLeft > 0) {
                            eventText.innerText = `${winner} Wins! Redirecting in ${secondsLeft}s...`;
                        } else {
                            clearInterval(countdown);
                        }
                    }, 1000);

                    setTimeout(() => {
                        window.location.href = "/win";
                    }, 10000);

                    return;
                }
            }
        }
    }

    // Optional: Check for a Draw (Board full)
    const isDraw = board.every(col => col.every(cellValue => cellValue !== 0 || col.includes("stone")));
    if (isDraw && winPhase === 0) {
        winPhase = 1;
        eventText.innerText = "It's a Draw!";
    }
}

async function loadModel() {
    try {
        session = await ort.InferenceSession.create("./model.onnx");
        console.log("AI Loaded");
    } catch (e) {
        console.log("AI load failed - usually due to local file restrictions");
    }
}