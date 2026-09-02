const SIZE = 9;
const LEADERBOARD_KEY = 'sudoku-top-10';
const THEME_KEY = 'sudoku-theme';
let puzzle = [];
let difficulty = 'medium';
let timerId = null;
let elapsedSeconds = 0;
let hintsUsed = 0;
let gameFinished = false;

function formatTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function startTimer() {
  window.clearInterval(timerId);
  elapsedSeconds = 0;
  document.getElementById('timer').innerText = formatTime(0);
  timerId = window.setInterval(() => {
    if (!gameFinished) {
      elapsedSeconds += 1;
      document.getElementById('timer').innerText = formatTime(elapsedSeconds);
    }
  }, 1000);
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let rowIndex = 0; rowIndex < SIZE; rowIndex++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let colIndex = 0; colIndex < SIZE; colIndex++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      if ((Math.floor(rowIndex / 3) + Math.floor(colIndex / 3)) % 2 === 0) {
        input.classList.add('shaded-block');
      }
      input.dataset.row = rowIndex;
      input.dataset.col = colIndex;
      input.inputMode = 'numeric';
      input.addEventListener('input', (event) => {
        event.target.value = event.target.value.replace(/[^1-9]/g, '');
        event.target.classList.remove('incorrect', 'correct');
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.classList.add('prefilled');
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  difficulty = document.getElementById('difficulty').value;
  const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
  const data = await res.json();
  if (data.error) return;
  hintsUsed = 0;
  gameFinished = false;
  document.getElementById('hint-count').innerText = '0';
  renderPuzzle(data.puzzle);
  document.getElementById('message').innerText = '';
  document.getElementById('message').className = '';
  startTimer();
}

async function useHint() {
  if (gameFinished) return;
  const response = await fetch('/hint', {method: 'POST'});
  const data = await response.json();
  if (data.error) {
    document.getElementById('message').innerText = data.error;
    return;
  }
  const input = document.querySelector(`[data-row="${data.row}"][data-col="${data.col}"]`);
  input.value = data.value;
  input.disabled = true;
  input.classList.add('hint');
  hintsUsed += 1;
  document.getElementById('hint-count').innerText = hintsUsed;
  document.getElementById('message').innerText = 'A cell has been revealed.';
}

function getBoard() {
  const inputs = document.querySelectorAll('.sudoku-cell');
  return Array.from({length: SIZE}, (_, row) => Array.from({length: SIZE}, (_, col) => {
    const value = inputs[row * SIZE + col].value;
    return value ? parseInt(value, 10) : 0;
  }));
}

function readScores() {
  try {
    const scores = JSON.parse(window.localStorage.getItem(LEADERBOARD_KEY) || '[]');
    return Array.isArray(scores) ? scores.filter((score) => score && typeof score.name === 'string') : [];
  } catch (error) { return []; }
}

function sortScores(scores) {
  return scores.slice().sort((first, second) => first.time - second.time || first.hints - second.hints);
}

function renderLeaderboard() {
  const selected = document.getElementById('leaderboard-difficulty').value;
  const scores = sortScores(readScores()).filter((score) => selected === 'all' || score.difficulty === selected).slice(0, 10);
  const body = document.getElementById('leaderboard-body');
  body.innerHTML = '';
  if (!scores.length) {
    body.innerHTML = '<tr><td colspan="5" class="empty-state">No scores yet. Be the first.</td></tr>';
    return;
  }
  scores.forEach((score, index) => {
    const row = document.createElement('tr');
    [index + 1, score.name, formatTime(score.time), score.difficulty[0].toUpperCase() + score.difficulty.slice(1), score.hints].forEach((value) => {
      const cell = document.createElement('td');
      cell.innerText = value;
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
}

function saveScore(name) {
  const scores = readScores();
  scores.push({name: name.trim(), time: elapsedSeconds, difficulty, hints: hintsUsed});
  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(sortScores(scores).slice(0, 30)));
  renderLeaderboard();
}

function openScoreDialog() {
  document.getElementById('score-summary').innerText = `${formatTime(elapsedSeconds)} with ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'}`;
  const dialog = document.getElementById('name-dialog');
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else saveScore(window.prompt('Enter your name') || 'Anonymous');
}

async function checkSolution() {
  if (gameFinished) return;
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board: getBoard()})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  document.querySelectorAll('.sudoku-cell').forEach((input, index) => {
    if (input.classList.contains('prefilled') || input.classList.contains('hint')) return;
    const isEmpty = input.value.trim() === '';
    const isIncorrect = incorrect.has(index) || isEmpty;
    input.classList.toggle('incorrect', isIncorrect);
    input.classList.toggle('correct', !isIncorrect);
  });
  if (incorrect.size === 0) {
    gameFinished = true;
    window.clearInterval(timerId);
    msg.innerText = `Solved in ${formatTime(elapsedSeconds)}.`;
    msg.className = 'success-message';
    openScoreDialog();
  } else {
    msg.innerText = 'Some cells are incorrect.';
    msg.className = 'error-message';
  }
}

function applyTheme(theme) {
  document.body.classList.toggle('dark-mode', theme === 'dark');
  document.getElementById('theme-toggle').innerText = theme === 'dark' ? 'Light mode' : 'Dark mode';
  window.localStorage.setItem(THEME_KEY, theme);
}

// Wire buttons
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('hint').addEventListener('click', useHint);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('leaderboard-difficulty').addEventListener('change', renderLeaderboard);
  document.getElementById('theme-toggle').addEventListener('click', () => applyTheme(document.body.classList.contains('dark-mode') ? 'light' : 'dark'));
  document.getElementById('score-form').addEventListener('submit', (event) => {
    if (event.submitter.value === 'save') {
      event.preventDefault();
      const name = document.getElementById('player-name').value.trim();
      if (name) {
        saveScore(name);
        document.getElementById('name-dialog').close();
      }
    }
  });
  applyTheme(window.localStorage.getItem(THEME_KEY) || 'light');
  renderLeaderboard();
  newGame();
});