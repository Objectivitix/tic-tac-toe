const events = (function () {
  const eMap = {};

  function on(eName, callbackFn) {
    if (!eMap[eName]) eMap[eName] = [];
    eMap[eName].push(callbackFn);
  }

  function off(eName, callbackFn) {
    if (!eMap[eName]) return;
    eMap[eName].splice(eMap[eName].index(callbackFn), 1);
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

const board = (function () {
  const boardArray = Array(9).fill("");
  const winningPosSets = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const squares = document.querySelectorAll(".board > div");

  squares.forEach(square => square.addEventListener(
    "click", emitEvent, {once: true}));

  function emitEvent(evt) {
    events.emit("squareClick", evt.target);
  }

  function render(index) {
    squares[index].textContent = boardArray[index];
  }

  function fillSquare(index, string) {
    boardArray[index] = string;
    render(index);
  }

  function getResult() {
    for (posSet of winningPosSets) {
      const line = posSet.map(pos => boardArray[pos]);
      if (line[0] && line.every(value => value === line[0]))
        return line[0];
    }

    if (boardArray.every(value => value !== ""))
      return "tie";
  }

  function freeze() {
    squares.forEach(square => square.removeEventListener("click", emitEvent));
  }

  return {
    fillSquare,
    getResult,
    freeze,
  };
})();

const Player = function(marker, name) {
  return {
    marker,
    name: name ? name : `Player ${marker}`,
  };
}

const game = (function () {
  const player1 = Player("X");
  const player2 = Player("O");
  let player1Turn = true;

  const resultDiv = document.querySelector(".result");

  events.on("squareClick", makeMove);

  function makeMove(square) {
    board.fillSquare(square.dataset.index, (player1Turn ? player1 : player2).marker);
    player1Turn = !player1Turn;

    const res = board.getResult();
    if (res) handleResult(res);
  }

  function handleResult(res) {
    board.freeze();

    const winner =
      res === player1.marker ? player1 :
      res === player2.marker ? player2 :
      res;

    resultDiv.textContent =
      winner === "tie" ? "It's a tie!" : `HEHEHEHAW ${winner.name} wins!`;
  }
})();