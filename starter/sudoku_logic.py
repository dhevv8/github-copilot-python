import copy
import random

SIZE = 9
BOX_SIZE = 3
EMPTY = 0
DIFFICULTY_CLUES = {
    'easy': 40,
    'medium': 32,
    'hard': 26,
}

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % BOX_SIZE
    start_col = col - col % BOX_SIZE
    for i in range(BOX_SIZE):
        for j in range(BOX_SIZE):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def remove_cells(board, clues):
    attempts = SIZE * SIZE - clues
    while attempts > 0:
        row = random.randrange(SIZE)
        col = random.randrange(SIZE)
        if board[row][col] != EMPTY:
            board[row][col] = EMPTY
            attempts -= 1

def count_solutions(board, limit=2):
    """Return the number of solutions, stopping once ``limit`` is reached."""
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                total = 0
                for candidate in range(1, SIZE + 1):
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        total += count_solutions(board, limit)
                        board[row][col] = EMPTY
                        if total >= limit:
                            return total
                return total
    return 1


def _remove_cells_with_unique_solution(board, clues):
    """Remove cells while retaining exactly one solution in the puzzle."""
    cells = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    while sum(cell != EMPTY for row in board for cell in row) > clues:
        random.shuffle(cells)
        removed = False
        for row, col in cells:
            if board[row][col] == EMPTY:
                continue
            value = board[row][col]
            board[row][col] = EMPTY
            if count_solutions(board) == 1:
                removed = True
                break
            board[row][col] = value
        if not removed:
            return False
    return True


def generate_puzzle(clues=35):
    """Generate a puzzle with the requested clue count and one solution."""
    if not 0 <= clues <= SIZE * SIZE:
        raise ValueError('clues must be between 0 and 81')

    while True:
        solution = create_empty_board()
        fill_board(solution)
        puzzle = deep_copy(solution)
        if _remove_cells_with_unique_solution(puzzle, clues):
            return puzzle, solution
