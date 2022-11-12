const board = (function() {
  const WINNING_POS_SETS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const boardArray = Array(9).fill("");

  const squares = document.querySelectorAll(".board > div");
  squares.forEach(square => square.addEventListener("click", makeMove));

  function makeMove(evt) {
    gameCore.makeMove(evt.target.dataset.index);
  }

  function renderSquare(index) {
    squares[index].textContent = boardArray[index];
  }

  function getBoardArray() {
    return boardArray;
  }

  function getAvailableIndices() {
    return boardArray.map((e, i) => e === "" ? i : -1).filter(e => e > -1);
  }

  function getResult(arr) {
    bArray = arr ?? boardArray;
    for (posSet of WINNING_POS_SETS) {
      const line = posSet.map(pos => bArray[pos]);
      if (line[0] && line.every(value => value === line[0])) {
        return line[0];
      }
    }

    if (bArray.every(value => value !== ""))
      return "tie";
  }

  function unbindSquare(index) {
    squares[index].removeEventListener("click", makeMove);
  }

  function unbindAll() {
    squares.forEach((_, i) => unbindSquare(i));
  }

  function fillSquare(index, string) {
    boardArray[index] = string;
    renderSquare(index);
  }

  function reset() {
    boardArray.fill("");
    squares.forEach((square, i) => {
      renderSquare(i);
      square.addEventListener("click", makeMove);
    });
  }

  return {
    getBoardArray,
    getAvailableIndices,
    getResult,
    unbindSquare,
    unbindAll,
    fillSquare,
    reset,
  };
})();

const Player = function(marker, name) {
  return {
    marker,
    name: name ? name : `Player ${marker}`,
  };
}

const bot = (function() {
  let opponentMarker;
  let botMarker;

  function createDataObject(boardArray, possibleMoves) {
    return {
      boardArray: boardArray.slice(),
      possibleMoves: possibleMoves.slice(),
    };
  }

  function simulateMove(move, marker, boardArray, possibleMoves) {
    boardArray[move] = marker;
    possibleMoves.splice(possibleMoves.indexOf(move), 1);
  }

  function getLeafValue(gameResult) {
    return (
      gameResult === botMarker ? -1 :
      gameResult === opponentMarker ? 1 :
      0
    );
  }

  function minimax(move, maximizingOpponent, alpha, beta, data) {
    let { boardArray, possibleMoves } = data;

    const marker = maximizingOpponent ? botMarker : opponentMarker;
    simulateMove(move, marker, boardArray, possibleMoves);

    const res = board.getResult(boardArray);
    if (res) return getLeafValue(res);

    if (maximizingOpponent) {
      let maxEval = -Infinity;
      for (move of possibleMoves) {
        const newData = createDataObject(boardArray, possibleMoves);
        const eval = minimax(move, false, alpha, beta, newData);
        maxEval = Math.max(eval, maxEval);

        alpha = Math.max(alpha, eval);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (move of possibleMoves) {
        const newData = createDataObject(boardArray, possibleMoves);
        const eval = minimax(move, true, alpha, beta, newData);
        minEval = Math.min(eval, minEval);

        beta = Math.min(beta, eval);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  function setMarkers(oMarker, bMarker) {
    opponentMarker = oMarker;
    botMarker = bMarker;
  }

  function computeOptimalMove() {
    const boardArray = board.getBoardArray();
    const possibleMoves = board.getAvailableIndices();

    const movesValueMap = {};

    for (move of possibleMoves) {
      const data = createDataObject(boardArray, possibleMoves);
      const value = minimax(move, true, -Infinity, Infinity, data);
      movesValueMap[value] = move;
    }

    const minKey = Object.keys(movesValueMap)
      .reduce((prev, curr) => prev < curr ? prev : curr);

    return movesValueMap[minKey];
  }

  return {
    setMarkers,
    computeOptimalMove,
  }
})();

const gameCore = (function() {
  const player1 = Player("X");
  const player2 = Player("O");

  let player1Turn = true;
  let player2IsBot;

  bot.setMarkers(player1.marker, player2.marker);

  function makeMove(index) {
    board.unbindSquare(index);
    board.fillSquare(index, (player1Turn ? player1 : player2).marker);

    const res = board.getResult();
    if (res) {
      const winner =
        res === player1.marker ? player1 :
        res === player2.marker ? player2 :
        res;

      gameUI.handleResult(winner);
    }

    player1Turn = !player1Turn;
    if (player2IsBot && !player1Turn)
      makeMove(bot.computeOptimalMove());
  }

  function useBotForPlayer2(boolean) {
    player2IsBot = boolean;
  }

  function reset() {
    player1Turn = true;
  }

  return {
    makeMove,
    useBotForPlayer2,
    reset,
  }
})();

const gameUI = (function() {
  const startButtons = document.querySelector(".start-buttons");
  const playerButton = startButtons.querySelector(".player");
  const botButton = startButtons.querySelector(".bot");
  const restartButton = document.querySelector(".restart-button");
  const boardDiv = document.querySelector(".board");
  const resultDiv = document.querySelector(".result");

  playerButton.addEventListener("click", setPlayer);
  botButton.addEventListener("click", setBot);
  restartButton.addEventListener("click", restartGame);

  function setPlayer() {
    gameCore.useBotForPlayer2(false);
    startGame();
  }

  function setBot() {
    gameCore.useBotForPlayer2(true);
    startGame();
  }

  function startGame() {
    startButtons.classList.add("nope");
    boardDiv.classList.remove("nope");
  }

  function restartGame() {
    board.reset();
    gameCore.reset();
    resetDisplay();
  }

  function resetDisplay() {
    startButtons.classList.remove("nope");
    restartButton.classList.add("nope");
    boardDiv.classList.add("nope");
    resultDiv.textContent = "";
  }

  function handleResult(winner) {
    board.unbindAll();

    restartButton.classList.remove("nope");
    resultDiv.textContent =
      winner === "tie" ? "It's a tie!" : `${winner.name} wins!`;
  }

  return {
    handleResult,
  }
})();
