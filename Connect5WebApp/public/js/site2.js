let oddPlayer = true;
let winPhase = 0;
let p1Ab = "";
let p2Ab = "";
let currentPowerUp = "";
let gameData = [];

// AI Configuration Variables
let session;
let inputName, outputName;

// --- INITIALIZATION ---

document.addEventListener("DOMContentLoaded", () => {
    const boardContainer = document.getElementById("board");
    const eventText = document.getElementById("eventText");
    const p1Btn = document.getElementById('p1powerup');
    const p2Btn = document.getElementById('p2powerup');
    const resetContainer = document.getElementById('resetbutton');

    // 1. Generate the Grid (7 columns, 6 rows)
    if (boardContainer) {
        boardContainer.innerHTML = ""; // Clear board before generation
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

    const columns = document.querySelectorAll(".column");

    // 2. Setup Reset Button
    if (resetContainer) {
        resetContainer.innerHTML = `<button id="realResetBtn">Reset Power-Up</button>`;
        document.getElementById("realResetBtn").onclick = resetAb;
    }

    // 3. Randomize Power-Ups
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

    // 5. Start AI loading process
    loadModel();
});

// --- AI LOGIC ---
async function loadModel() {
    if (typeof ort === "undefined") {
        setTimeout(loadModel, 500);
        return;
    }

    try {
        console.log("Attempting manual data fetch...");

        // 1. Fetch the .data file manually to bypass WASM mounting issues
        const dataResponse = await fetch("/connect5_model.onnx.data");
        const dataBuffer = await dataResponse.arrayBuffer();

        // 2. Load the model and explicitly point to the data we just fetched
        session = await ort.InferenceSession.create("/connect5_model.onnx", {
            executionProviders: ['wasm'],
            externalData: [
                {
                    data: dataBuffer,
                    path: "connect5_model.onnx.data" // Must match the name inside the .onnx file
                }
            ]
        });

        inputName = session.inputNames[0];
        outputName = session.outputNames[0];

        console.log("✅ AI Session Created Successfully (Manual Load)");
        document.getElementById("predict").innerText = "🧠 AI Online: Waiting for move...";
        updateAI();
    } catch (e) {
        console.error("❌ AI load failed:", e);
        document.getElementById("predict").innerText = "🧠 AI Offline: See F12 Console";
    }
}
async function updateAI() {
    if (!session || winPhase > 0) return;

    try {
        const boardData = [];
        const columns = document.querySelectorAll(".column");

        // Flatten board into 42 values (1.0 for P1, -1.0 for P2, 0.0 for Empty)
        // We iterate through cells as they appear in the DOM (Column 1, Row 1-6, etc.)
        columns.forEach(col => {
            col.querySelectorAll(".cell").forEach(cell => {
                if (cell.classList.contains("p1")) boardData.push(1.0);
                else if (cell.classList.contains("p2")) boardData.push(-1.0);
                else boardData.push(0.0);
            });
        });

        const inputTensor = new ort.Tensor("float32", new Float32Array(boardData), [1, 42]);
        const feeds = {};
        feeds[inputName] = inputTensor;

        const results = await session.run(feeds);
        const output = results[outputName].data;

        // Find the index of the highest probability move
        const bestMove = output.indexOf(Math.max(...output));
        document.getElementById("predict").innerText = `🧠 AI Suggests Column: ${bestMove + 1}`;
    } catch (e) {
        console.error("AI Inference Error:", e);
    }
}

// --- GAMEPLAY HELPER FUNCTIONS ---

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
                    return;
                }
            }

            oddPlayer = !oddPlayer;
            eventText.innerText = oddPlayer ? "Player 1's Turn" : "Player 2's Turn";
            checkWin(columns, eventText);
            updateAI();
            break;
        }
    }
}

function checkWin(columns, eventText) {
    const rows = 6, cols = 7, winCondition = 5;
    const board = [];

    columns.forEach(col => {
        let colData = [];
        col.querySelectorAll(".cell").forEach(cell => {
            if (cell.classList.contains("p1")) colData.push(1);
            else if (cell.classList.contains("p2")) colData.push(-1);
            else colData.push(0);
        });
        board.push(colData);
    });

    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const player = board[c][r];
            if (player === 0) continue;

            const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
            for (const [dc, dr] of directions) {
                let count = 1;
                for (let i = 1; i < winCondition; i++) {
                    const nextC = c + (dc * i), nextR = r + (dr * i);
                    if (nextC >= 0 && nextC < cols && nextR >= 0 && nextR < rows && board[nextC][nextR] === player) count++;
                    else break;
                }
                if (count === winCondition) {
                    winPhase = 1;
                    const winnerValue = (player === 1) ? "Player 1" : "Player 2";
                    eventText.innerText = `${winnerValue} Wins!`;
                    setTimeout(() => { window.location.href = `/win?winner=${winnerValue}`; }, 2000);
                    return;
                }
            }
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

function resetAb() { currentPowerUp = ""; console.log("Power-Up Reset"); }

window.useDouble = function () {
    if ((p1Ab === "Double" && oddPlayer) || (p2Ab === "Double" && !oddPlayer)) {
        currentPowerUp = "Double";
        console.log("Double Move Active");
    }
};

window.useStone = function () {
    if ((p1Ab === "Stone" && oddPlayer) || (p2Ab === "Stone" && !oddPlayer)) {
        currentPowerUp = "Stone";
        console.log("Stone Placement Active");
    }
};