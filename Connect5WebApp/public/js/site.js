const columns = document.querySelectorAll(".column");

let oddPlayer = true;
let eventText = document.getElementById("eventText");

let winPhase = 0;

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

            console.log("Hi")

            if (oddPlayer) {
                columnCells[i].classList.add("p1");
                oddPlayer = false;
            } else {
                columnCells[i].classList.add("p2");
                oddPlayer = true;
            }

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
            if (oddPlayer) {
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
            if (oddPlayer) {
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
            }
        }
    });
    console.log("Bpard", board)
    return board;
}

function checkWin() {
    const board = getBoardState();
    const rows = board.length;
    const cols = board[0].length;

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
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && board[newRow][newCol] === player) {
                    count++;
                } else break;
            }

            // Check in the opposite direction
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

    // Loop through the board to find the last placed piece
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col] && isWinningMove(row, col, board[row][col])) {
                winPhase = 1;
                eventText.innerText = `${board[row][col]} wins!`;
                return;
            }
        }
    }
}

