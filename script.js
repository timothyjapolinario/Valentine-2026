const puzzle = document.getElementById("puzzle");
const message = document.getElementById("message");
// rowCounts defines how many columns each row has (first row 4, others 3)
const rowCounts = [4, 3, 3];
const rows = rowCounts.length;
const maxCols = Math.max(...rowCounts);
let tiles = [];
// index where we want the empty slot to end up after shuffling
let initialEmptyIndex = -1;

function indexToRC(index) {
  let r = 0;
  let i = index;
  while (r < rows && i >= rowCounts[r]) {
    i -= rowCounts[r];
    r++;
  }
  return { r, c: i };
}

function rcToIndex(r, c) {
  if (r < 0 || r >= rows) return -1;
  if (c < 0 || c >= rowCounts[r]) return -1;
  let idx = 0;
  for (let i = 0; i < r; i++) idx += rowCounts[i];
  return idx + c;
}

function getNeighbors(index) {
  const { r, c } = indexToRC(index);
  const neighbors = [];
  const left = rcToIndex(r, c - 1);
  const right = rcToIndex(r, c + 1);
  const up = rcToIndex(r - 1, c);
  const down = rcToIndex(r + 1, c);
  if (left !== -1) neighbors.push(left);
  if (right !== -1) neighbors.push(right);
  if (up !== -1) neighbors.push(up);
  if (down !== -1) neighbors.push(down);
  return neighbors;
}

function findPath(start, goal) {
  if (start === goal) return [start];
  const queue = [start];
  const prev = new Map();
  const visited = new Set([start]);
  while (queue.length) {
    const cur = queue.shift();
    const neigh = getNeighbors(cur);
    for (const n of neigh) {
      if (visited.has(n)) continue;
      visited.add(n);
      prev.set(n, cur);
      if (n === goal) {
        const path = [goal];
        let p = goal;
        while (prev.has(p)) {
          p = prev.get(p);
          path.push(p);
        }
        return path.reverse();
      }
      queue.push(n);
    }
  }
  return null;
}

function createPuzzle() {
  tiles = [];
  puzzle.innerHTML = "";
  message.textContent = "";

  // create tiles row by row according to rowCounts
  const totalTiles = rowCounts.reduce((a, b) => a + b, 0);
  // prefer the 4th column in the first row (row 0, col 3) as the initial empty slot
  let emptyStartIndex = rcToIndex(0, 3);
  if (emptyStartIndex === -1) emptyStartIndex = totalTiles - 1;
  initialEmptyIndex = emptyStartIndex;

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < rowCounts[r]; c++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");

      if (idx === emptyStartIndex) {
        tile.classList.add("empty");
      } else {
        const x = c * -100;
        const y = r * -100;
        tile.style.backgroundPosition = `${x}px ${y}px`;
        tile.dataset.correct = idx;
      }

      // place tile using CSS grid coordinates
      tile.style.gridColumnStart = c + 1;
      tile.style.gridRowStart = r + 1;

      tile.addEventListener("click", () => moveTile(tile));
      tiles.push(tile);
      idx++;
    }
  }

  // size the puzzle container and tile backgrounds to match the irregular grid
  const totalCols = maxCols;
  puzzle.style.width = `${totalCols * 100}px`;
  puzzle.style.height = `${rows * 100}px`;
  puzzle.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;
  tiles.forEach((t) => {
    if (!t.classList.contains("empty"))
      t.style.backgroundSize = `${totalCols * 100}px ${rows * 100}px`;
  });

  shuffleTiles();
  tiles.forEach((tile) => puzzle.appendChild(tile));
  // highlight the preferred empty cell position
  updateEmptyHighlight();
}

function shuffleTiles(moves = 100) {
  for (let i = 0; i < moves; i++) {
    const emptyIndex = tiles.findIndex((t) => t.classList.contains("empty"));
    const possibleMoves = [];

    const { r, c } = indexToRC(emptyIndex);
    // left
    const left = rcToIndex(r, c - 1);
    if (left !== -1) possibleMoves.push(left);
    // right
    const right = rcToIndex(r, c + 1);
    if (right !== -1) possibleMoves.push(right);
    // up
    const up = rcToIndex(r - 1, c);
    if (up !== -1) possibleMoves.push(up);
    // down
    const down = rcToIndex(r + 1, c);
    if (down !== -1) possibleMoves.push(down);

    const move =
      possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

    [tiles[emptyIndex], tiles[move]] = [tiles[move], tiles[emptyIndex]];
  }
  // after shuffling, update each tile's grid position to match its array index
  tiles.forEach((t, i) => {
    const { r, c } = indexToRC(i);
    t.style.gridColumnStart = c + 1;
    t.style.gridRowStart = r + 1;
  });

  // ensure the empty tile ends up at the preferred initialEmptyIndex
  if (initialEmptyIndex !== -1) {
    const currentEmpty = tiles.findIndex((t) => t.classList.contains("empty"));
    if (currentEmpty !== -1 && currentEmpty !== initialEmptyIndex) {
      // find a legal path from currentEmpty to initialEmptyIndex and perform those moves
      const path = findPath(currentEmpty, initialEmptyIndex);
      if (path && path.length > 1) {
        for (let i = 1; i < path.length; i++) {
          const from = path[i - 1];
          const to = path[i];
          [tiles[from], tiles[to]] = [tiles[to], tiles[from]];
        }
        // update positions for all tiles after performing the path moves
        tiles.forEach((t, i) => {
          const { r, c } = indexToRC(i);
          t.style.gridColumnStart = c + 1;
          t.style.gridRowStart = r + 1;
        });
      }
    }
  }
  // ensure the highlight is on the preferred empty position
  updateEmptyHighlight();
}

// start blurred until solved
function setInitialBlur() {
  puzzle.classList.add("blurred");
}

function updateEmptyHighlight() {
  if (initialEmptyIndex === -1) return;
  tiles.forEach((t, i) => {
    t.classList.toggle("empty-highlight", i === initialEmptyIndex);
  });
}

function moveTile(tile) {
  const index = tiles.indexOf(tile);
  if (index === -1) return;

  const emptyIndex = tiles.findIndex((t) => t.classList.contains("empty"));
  const validMoves = [];

  const { r: er, c: ec } = indexToRC(emptyIndex);
  const left = rcToIndex(er, ec - 1);
  const right = rcToIndex(er, ec + 1);
  const up = rcToIndex(er - 1, ec);
  const down = rcToIndex(er + 1, ec);
  if (left !== -1) validMoves.push(left);
  if (right !== -1) validMoves.push(right);
  if (up !== -1) validMoves.push(up);
  if (down !== -1) validMoves.push(down);

  if (validMoves.includes(index)) {
    [tiles[index], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[index]];

    // update grid placement for swapped tiles
    const posA = indexToRC(index);
    const posB = indexToRC(emptyIndex);
    const tileA = tiles[index];
    const tileB = tiles[emptyIndex];
    tileA.style.gridColumnStart = posA.c + 1;
    tileA.style.gridRowStart = posA.r + 1;
    tileB.style.gridColumnStart = posB.c + 1;
    tileB.style.gridRowStart = posB.r + 1;

    // re-render order (not necessary for positioning but keeps DOM stable)
    puzzle.innerHTML = "";
    tiles.forEach((t) => puzzle.appendChild(t));

    // keep the highlight on the preferred empty position
    updateEmptyHighlight();

    checkWin();
  }
}

function checkWin() {
  const solved = tiles.every((tile, index) => {
    if (tile.classList.contains("empty")) return true;
    return Number(tile.dataset.correct) === index;
  });

  if (solved) {
    message.textContent = "You solved it! Will you be my Valentine? 💖";
    // remove blur to reveal the complete image
    puzzle.classList.remove("blurred");
  }
}

//setInitialBlur();
createPuzzle();
