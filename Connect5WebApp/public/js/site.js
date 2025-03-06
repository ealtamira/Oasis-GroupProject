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

// Load AI Model on Page Load
window.addEventListener("load", loadModel);

resetbutton.innerHTML = `<button onclick="resetAb()">Reset</button>`;
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
    if (p1Ab == "Double" && oddPlayer || p2Ab == "Double" && !oddPlayer) {
        currentPowerUp = "Double";
        console.log("Power Up Double Activated!");
    } else {
        console.log("Invalid Turn.");
    }
}

function useStone() {
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
        player: oddPlayer ? "p1" : "p2",
        powerUp: currentPowerUp || null
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

            // Update AI prediction after each move
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

function getBoardState() {
    const board = [];
    const columns = document.querySelectorAll(".column");

    columns.forEach((column, colIndex) => {
        let colState = [];
        column.querySelectorAll(".cell").forEach((cell, rowIndex) => {
            if (rowIndex < 6) { // Only consider the first 6 rows
                if (cell.classList.contains("p1")) colState.push(1);
                else if (cell.classList.contains("p2")) colState.push(2);
                else if (cell.classList.contains("stone")) colState.push(-1);
                else colState.push(0);
            }
        });
        board.push(colState);
    });

    // Flatten the board to match the expected input length of 44
    return board; // Ensure it only returns 44 elements
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

            if (count >= 5) return true;
        }
        return false;
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col] && isWinningMove(row, col, board[row][col])) {
                winPhase = 1;
                eventText.innerText = `${board[row][col]} wins!`;
                let winner = board[row][col];
                setTimeout(() => {
                    window.location.href = `/win?winner=${winner}`;
                }, 2000);
                return;
            }
        }
    }
}

// AI prediction update function
let model = null;

// Ensure the model is loaded before any prediction
async function loadModel() {
    try {
        console.log("Loading the model...");
        model = await ort.InferenceSession.create("./js/connect5_model.onnx");
        console.log("Model loaded successfully");
    } catch (err) {
        console.error("Error loading AI model:", err);
    }
}

// AI prediction update function
async function updateAIPrediction() {
    if (!model) {
        console.error("AI model is not loaded properly.");
        return;
    }

    const input = getBoardState().flat().slice(0, 44); // This should return a flattened 44-element array

    try {
        console.log("Input data:", input);

        // Ensure the input data is a Float32Array
        const inputArray = new Float32Array(input);  // Convert the input to Float32Array
        const inputTensor = new ort.Tensor("float32", inputArray, [1, 44]); // 1 sample, 44 features

        // Create an object to feed the model
        const feeds = {
            input: inputTensor  // The input name used during export is 'input'
        };

        // Run the model
        const output = await model.run(feeds);
        console.log("AI Prediction output:", output);

        // Extract the prediction result (assuming 'output' is the name of the output tensor)
        const prediction = output.output.data;
        console.log("Predicted Output:", prediction);

    } catch (err) {
        console.error("Error during prediction:", err);
    }
}
