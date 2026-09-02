# Sudoku Challenge

A browser-based Sudoku game built with Flask, vanilla JavaScript, and CSS. Generate puzzles at three difficulty levels, use hints, track solve time, check entries as you play, and save local top scores.

## Features

- Unique-solution Sudoku generation with Easy, Medium, and Hard difficulties
- Interactive 9 x 9 board with prefilled clues
- Solution checking with red incorrect or empty cells and green correct cells
- Hint support with a visible hint counter
- Timer displayed in `MM:SS` format
- Local Top 10 leaderboard sorted by solve time and hints used
- Light and dark themes persisted in browser storage
- Responsive layout for desktop and mobile browsers

## Requirements

- Python 3.11 or newer
- A modern browser such as Chrome, Firefox, or Edge

The backend dependencies are listed in `starter/requirements.txt`. The test suite additionally requires `pytest`.

## Installation

From the repository root, open a terminal and move into the application directory:

```bash
cd starter
```

Create and activate a virtual environment.

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### macOS or Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the application and test dependencies:

```bash
python -m pip install -r requirements.txt
python -m pip install pytest
```

## Run the Application

With the virtual environment activated and the current directory set to `starter`, start Flask:

```bash
python app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in a browser. Use **New Game** to load a puzzle, choose a difficulty, enter values, and select **Check Solution** for feedback.

Stop the development server with `Ctrl+C`.

## Run the Tests

From the `starter` directory, run the complete test suite with:

```bash
cd starter
.\.venv\Scripts\python.exe -m pytest -q
```

The tests cover board creation, Sudoku safety rules, solving and puzzle generation, unique solutions, Flask routes, and solution checking. Puzzle generation uses randomness, so generation tests may take several seconds.

## Manual Verification

With the application running:

1. Start a new game and confirm that the board contains disabled clue cells and editable empty cells.
2. Enter a wrong value and leave another editable cell empty.
3. Select **Check Solution** and confirm both cells are red, while correct entries are green.
4. Use hints or complete the puzzle manually and check that a solved board displays a success message.
5. Save a score and confirm it appears in the local leaderboard.
6. Toggle dark mode and refresh the page to confirm the theme persists.

## Project Structure

```text
starter/
├── app.py                 # Flask routes and active game state
├── sudoku_logic.py        # Sudoku generation and validation logic
├── test_sudoku.py         # pytest test suite
├── requirements.txt       # Runtime dependency list
├── static/
│   ├── main.js            # Board interaction and browser state
│   └── styles.css         # Layout, themes, and cell highlighting
└── templates/
	└── index.html         # Game page markup
```

## API Routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/` | `GET` | Render the game page |
| `/new` | `GET` | Generate a new puzzle; accepts `difficulty=easy`, `medium`, or `hard` |
| `/hint` | `POST` | Reveal one empty cell in the active puzzle |
| `/check` | `POST` | Compare a submitted board with the active solution |

The active puzzle and solution are kept in server memory for the running process. Leaderboard scores and theme preferences are stored in the browser's `localStorage`.
