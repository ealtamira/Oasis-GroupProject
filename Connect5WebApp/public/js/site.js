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

    columns.forEach(column => {
        let colState = [];
        column.querySelectorAll(".cell").forEach(cell => {
            if (cell.classList.contains("p1")) colState.push(1);
            else if (cell.classList.contains("p2")) colState.push(2);
            else if (cell.classList.contains("stone")) colState.push(-1);
            else colState.push(0);
        });
        board.push(colState);
    });

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

const input = [ /* your data here (44 elements) */ ];
const inputArray = new Float32Array(input);


let someInputData = [
    0, 1, 0, 1, 0, 1,   // Row 1 (7 columns)
    1, 0, 1, 0, 1, 0,   // Row 2
    0, 1, 0, 1, 0, 1,   // Row 3
    1, 0, 1, 0, 1, 0,   // Row 4
    0, 1, 0, 1, 0, 1,   // Row 5
    1, 0, 1, 0, 1, 0,   // Row 6
    0, 1, 0, 1, 0, 1,   // Row 7 (Flattened)
    
    // 2 extra elements for additional features (e.g., player turn and power-up)
    1, 0   // Example: player 1's turn, no power-up (adjust based on actual features)
];

async function loadModel() {
    try {
        model = await ort.InferenceSession.create("./js/connect5_model.onnx");
        console.log("Model loaded successfully");
    } catch (err) {
        console.error("Error loading AI model:", err);
    }
}

async function updateAIPrediction(input) {
    if (!model) {
        console.error("AI model is not loaded properly.");
        return;
    }

    try {
        // Ensure input is a Float32Array and reshape it to [1, 44]
        const inputArray = new Float32Array(input);  // Convert input data to Float32Array
        const inputTensor = new ort.Tensor("float32", inputArray, [1, 44]);  // Shape [1, 44]

        // Create an object with the input name and corresponding tensor
        const feeds = {
            input: inputTensor  // Use the correct input name used in the export
        };

        // Run the model
        const output = await model.run(feeds);
        console.log("AI Prediction output:", output);
    } catch (err) {
        console.error("Error during prediction:", err);
    }
}


// Ensure the model is loaded before running predictions
async function startPrediction(input) {
    await loadModel();  // Wait for the model to load
    await updateAIPrediction(input);
}

// Example usage
startPrediction(someInputData);
