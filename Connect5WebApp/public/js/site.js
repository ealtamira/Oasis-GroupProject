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
            break;
        }
    }

    // Update AI prediction after each move
    updateAIPrediction();
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
    const rows = 6;  
    const cols = 7;  
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
async function updateAIPrediction() {
    try {
        const boardState = getBoardState();  // This should return a 6x7 array
        console.log("Raw Board State:", boardState); // Log to verify
        
        const flatBoard = boardState.flat();  // Flatten the 2D array into a 1D array (42 elements)
        console.log("Flattened Board State:", flatBoard); // Verify the flattened state
        
        // Function to preprocess board state
        function preprocessBoardState(boardState) {
            // Flatten the board and map each cell to a corresponding value
            const processedBoard = boardState.flat().map(cell => {
                if (cell === null) return 0;  // Empty cell
                if (cell === "p1") return 1;  // Player 1
                if (cell === "p2") return 2;  // Player 2
                return 0;  // Default case, should not occur
            });
        
            console.log("Processed Board:", processedBoard); // Verify the processed board
            return processedBoard;
        }
        

        // Preprocess the board state
        const processedBoard = preprocessBoardState(boardState);
        console.log("Processed Board state:", processedBoard); // Debugging the processed board

        // Check that the board is the correct size (42 elements)
        if (processedBoard.length !== 42) {
            throw new Error("Board state does not have 42 elements.");
        }

        // Add extra features to match the model's input size (44)
        const currentPlayerFeature = oddPlayer ? 1 : 2; // 1 for Player 1, 2 for Player 2
        const gamePhaseFeature = winPhase > 0 ? 1 : 0; // 1 for win phase, 0 for ongoing

        // Extend the board state with the extra features
        const extendedBoard = [...processedBoard, currentPlayerFeature, gamePhaseFeature];

        // Check if the extended board size is 44 (42 + 2 features)
        if (extendedBoard.length !== 44) {
            throw new Error("Extended board state does not have 44 elements.");
        }

        // Create the input tensor with the extended board (now size 44)
        const inputTensor = new ort.Tensor("float32", new Float32Array(extendedBoard), [1, 44]);

        console.log("Input Tensor:", inputTensor); // Debugging the input tensor

        // Load the model and run the inference
        const session = await ort.InferenceSession.create("js/connect5_model.onnx");
        const outputs = await session.run({ input: inputTensor });

        console.log("Model Output:", outputs); // Debugging the model output

        // Extract move probabilities from the model output
        const moveProbabilities = outputs.output ? outputs.output.data : outputs[Object.keys(outputs)[0]].data;

        // Check if the output is valid and contains move probabilities
        if (moveProbabilities && moveProbabilities.length === 7) {
            console.log("Move Probabilities:", moveProbabilities); // Debugging the move probabilities

            // Ensure moveProbabilities contains valid numbers (no NaN values)
            if (moveProbabilities.every(prob => !isNaN(prob))) {
                // Get the best move (highest probability column)
                const bestMove = moveProbabilities.indexOf(Math.max(...moveProbabilities));
                aiPredict.innerText = `AI predicts column: ${bestMove}`;
            } else {
                console.error("Invalid output data: NaN values detected in move probabilities");
                aiPredict.innerText = "AI prediction error";
            }
        } else {
            console.error("Invalid output data or shape:", moveProbabilities);
            aiPredict.innerText = "AI prediction error";
        }
    } catch (error) {
        console.error("Failed to load model:", error);
        aiPredict.innerText = "AI prediction error";
    }
}






