# Project Instructions: Sudoku Challenge App

## Project Overview
A web-based Sudoku Challenge application built with Python/Flask and vanilla JavaScript. Features dynamic puzzle generation, interactive hint mechanisms, solution validation, real-time timer tracking, dark mode, and a local Top 10 leaderboard.

---

## Tech Stack & Architecture

### Tech Stack
- **Backend:** Python 3.11, Flask
- **Puzzle Generation:** Backtracking algorithm with customizable difficulty levels (easy, medium, hard)
- **Frontend:** Vanilla JavaScript (ES6+), CSS3 (Custom Properties for themes)
- **Testing:** `pytest`

### Architecture Decisions
- **State Management:** All active game states (`puzzle`, `solution`, `difficulty`) are stored server-side in a `CURRENT` dictionary to prevent client-side tampering.
- **Sudoku Board Representation:** Represented as a 9 x 9 2D list where `0` denotes an empty cell.
- **Leaderboard Storage:** Top 10 scores stored in browser `localStorage` with sorting by time, then hints used
- **Theme Persistence:** Dark mode preference saved in `localStorage`

---

## Technical & Coding Conventions

### Python (Backend)
- **Type Annotations & Docs:** Enforce type hints on all function signatures; supply detailed docstrings for non-trivial logic.
- **Validation:** Always validate JSON payload data prior to execution.
- **Constants:** Use pre-defined constants from `sudoku_logic` (`SIZE = 9`, `EMPTY = 0`, `BOX_SIZE = 3`).
- **Data Exchange:** Always exchange Sudoku grids as $9 \times 9$ 2D lists using `0` for empty cells.

### JavaScript (Frontend)
- **Variables:** Default to `const`; use `let` strictly when variable reassignment is required.
- **Global Declaration:** Document top-level variables (`solution`, `difficulty`, `timerId`, `elapsedSeconds`, `hintsUsed`) at the entry of the script.
- **DOM & Storage Naming:** Prefix DOM query selectors clear descriptors (e.g., `inputs`, `scoreboard`). Prefix `localStorage` keys with the module name (e.g., `sudoku-theme`, `sudoku-top-10`).
- **Event Handling:** Use event delegation attached inside the main `DOMContentLoaded`/`load` listener.
- **Indexing Display:** Convert internal 0-based index values to user-friendly 1-based indexing for UI messages (e.g., *"Row X, Column Y"*).

### CSS & Theming
- **CSS Variables:** Declare design tokens in `:root` and override within `body[data-theme='dark']`. Do not hardcode hex/RGB color values.
- **Responsiveness & A11y:** Use `clamp()` for flexible typography and layout scaling. Maintain proper visual focus states and ARIA labels.

---

## Core Game Logic & Rules

### 1. Puzzle Generation
- **Validation Rule:** Each row, column, and 3 x 3 sub-box must contain digits 1–9 without duplicates.
- **Starting Clues:** Easy (40), Medium (32), Hard (26).
- **Algorithm:** Generate a complete valid grid using a backtracking algorithm, then remove random cells according to the chosen difficulty level.

### 2. Solution Validation
- User submission must exactly match the `solution` stored server-side
- When checking, compare user board against `CURRENT["solution"]`; return all incorrect cell coordinates
- Empty cells and missing values count as incorrect
- A puzzle is "solved" only when user fills all cells correctly AND has no incorrect entries

### 3. Hint Engine
- Fills one random empty cell from the current grid with its corresponding solution value.
- Applies the `.hint` CSS class to the cell and sets `disabled = true` to prevent modifications.
- Increments the active game's `hintsUsed` counter.
- Returns an error payload (`"No empty cells left"`) if no empty cells exist.

### 4. Leaderboard Engine
- Maintains the Top 10 fastest completion times per difficulty.
- **Sorting Logic:** Primary by `elapsedTime` (asc), Secondary by `hintsUsed` (asc).
- **Data Structure:** Saved as array of objects: `{ name, time (seconds), difficulty, hints }`
- **UI Format:** Ordered list showing Rank, Name, Difficulty, and Formatted Time (`MM:SS`).

---

## Active Tasks & Required Fixes


1. **Check Solution Highlighting:** Currently may not highlight all incorrect entries. Ensure that after clicking "Check", ALL incorrect cells turn red and ALL correct cells turn green. Empty user cells should turn red.

2. **Missing Features:**
   - **Hint Button:** Should work correctly and lock the hinted cell
   - **Check Puzzle:** Should highlight missing/wrong fields in red
   - **Hint Count:** Display number of hints used; include in leaderboard sorting
   - **Leaderboard:** Top 10 list with player names, times, difficulty, and hints
   - **Dark Mode Toggle:** Functional theme switcher visible in top bar
   - **Timer:** Display elapsed time in MM:SS format; update in real-time

## Testing
- Run tests: `pytest test_sudoku_logic.py`
- Current tests cover: board creation, safety checking, empty cell finding, board filling, puzzle generation
- Manual testing: start server with `python app.py` and navigate to `http://localhost:8000`

## Development Workflow
1. For backend changes, restart Flask app
2. For frontend changes, hard refresh browser 
3. When adding new features, ensure they work across light and dark modes
4. For puzzle logic changes, run tests to validate