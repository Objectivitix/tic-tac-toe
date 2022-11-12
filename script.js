const events = (function() {
  const eMap = {};

  function on(eName, callbackFn) {
    if (!eMap[eName]) eMap[eName] = [];
    eMap[eName].push(callbackFn);
  }

  function off(eName, callbackFn) {
    if (!eMap[eName]) return;
    eMap[eName].splice(eMap[eName].indexOf(callbackFn), 1);
  }

  function emit(eName, data) {
    if (!eMap[eName]) return;
    eMap[eName].forEach(fn => fn(data));
  }

  return {
    on,
    off,
    emit,
  }
})();

const board = (function() {
  const boardArray = Array(9).fill("");
  const winningPosSets = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const squares = document.querySelectorAll(".board > div");

  squares.forEach(square => square.addEventListener("click", emitEvent));

  function emitEvent(evt) {
    events.emit("squareClick", evt.target.dataset.index);
  }

  function renderSquare(index) {
    squares[index].textContent = boardArray[index];
  }

  function fillSquare(index, string) {
    boardArray[index] = string;
    renderSquare(index);
  }

  function getResult(arr) {
    bArray = arr ?? boardArray;
    for (posSet of winningPosSets) {
      const line = posSet.map(pos => bArray[pos]);
      if (line[0] && line.every(value => value === line[0])) {
        return line[0];
      }
    }

    if (bArray.every(value => value !== ""))
      return "tie";
  }

  function getBoardArray() {
    return boardArray;
  }

  function getAvailableIndices() {
    return boardArray.map((e, i) => e === "" ? i : -1).filter(e => e > -1);
  }

  function unbindAll() {
    squares.forEach(square => square.removeEventListener("click", emitEvent));
  }

  function unbindSquare(index) {
    squares[index].removeEventListener("click", emitEvent);
  }

  return {
    fillSquare,
    getResult,
    getBoardArray,
    getAvailableIndices,
    unbindAll,
    unbindSquare,
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

  function setMarkers(oMarker, bMarker) {
    opponentMarker = oMarker;
    botMarker = bMarker;
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

  function createDataObject(boardArray, possibleMoves) {
    return {
      boardArray: boardArray.slice(),
      possibleMoves: possibleMoves.slice(),
    };
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

  function computeOptimalMove() {
    const boardArray = board.getBoardArray();
    const possibleMoves = board.getAvailableIndices();

    const movesValueMap = {};

    for (move of possibleMoves) {
      const initialData = createDataObject(boardArray, possibleMoves);
      const value = minimax(move, true, -Infinity, Infinity, initialData);
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

const game = (function() {
  const player1 = Player("X");
  const player2 = Player("O");
  let player1Turn = true;

  bot.setMarkers(player1.marker, player2.marker);

  const resultDiv = document.querySelector(".result");

  events.on("squareClick", makeMove);

  function makeMove(index) {
    board.unbindSquare(index);
    board.fillSquare(index, (player1Turn ? player1 : player2).marker);

    const res = board.getResult();
    if (res) handleResult(res);

    player1Turn = !player1Turn;
    if (!player1Turn) makeMove(bot.computeOptimalMove());
  }

  function handleResult(res) {
    board.unbindAll();

    const winner =
      res === player1.marker ? player1 :
      res === player2.marker ? player2 :
      res;

    resultDiv.textContent =
      winner === "tie" ? "It's a tie!" : `HEHEHEHAW ${winner.name} wins!`;
  }
})();
