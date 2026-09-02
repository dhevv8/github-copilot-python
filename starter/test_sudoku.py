import copy

import pytest

import app as app_module
import sudoku_logic


@pytest.fixture
def client():
    app_module.app.config.update(TESTING=True)
    app_module.CURRENT['puzzle'] = None
    app_module.CURRENT['solution'] = None
    with app_module.app.test_client() as test_client:
        yield test_client
    app_module.CURRENT['puzzle'] = None
    app_module.CURRENT['solution'] = None


def assert_valid_solution(board):
    expected = set(range(1, sudoku_logic.SIZE + 1))
    assert len(board) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in board)
    assert all(set(row) == expected for row in board)
    assert all(
        {board[row][col] for row in range(sudoku_logic.SIZE)} == expected
        for col in range(sudoku_logic.SIZE)
    )
    assert all(
        {
            board[row][col]
            for row in range(box_row, box_row + 3)
            for col in range(box_col, box_col + 3)
        }
        == expected
        for box_row in range(0, sudoku_logic.SIZE, 3)
        for box_col in range(0, sudoku_logic.SIZE, 3)
    )


def test_create_empty_board_has_expected_shape_and_values():
    board = sudoku_logic.create_empty_board()

    assert board == [[sudoku_logic.EMPTY] * sudoku_logic.SIZE for _ in range(9)]
    assert all(board[row] is not board[row + 1] for row in range(8))


def test_deep_copy_is_independent():
    original = [[1, 2], [3, 4]]

    copied = sudoku_logic.deep_copy(original)
    copied[0][0] = 9

    assert original == [[1, 2], [3, 4]]
    assert copied == [[9, 2], [3, 4]]


def test_is_safe_rejects_row_column_and_box_conflicts():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 5

    assert sudoku_logic.is_safe(board, 0, 1, 5) is False
    assert sudoku_logic.is_safe(board, 1, 0, 5) is False
    assert sudoku_logic.is_safe(board, 1, 1, 5) is False
    assert sudoku_logic.is_safe(board, 1, 1, 6) is True


def test_fill_board_produces_a_valid_solution():
    board = sudoku_logic.create_empty_board()

    assert sudoku_logic.fill_board(board) is True
    assert_valid_solution(board)


def test_fill_board_reports_unsolvable_board():
    board = sudoku_logic.create_empty_board()
    board[0][:8] = [1, 2, 3, 4, 5, 6, 7, 8]
    board[1][0] = 1

    assert sudoku_logic.fill_board(board) is False


def test_remove_cells_removes_requested_number_of_clues():
    board = [[1 for _ in range(sudoku_logic.SIZE)] for _ in range(sudoku_logic.SIZE)]

    sudoku_logic.remove_cells(board, clues=70)

    assert sum(cell != sudoku_logic.EMPTY for row in board for cell in row) == 70


def test_generate_puzzle_returns_solution_and_requested_clues():
    puzzle, solution = sudoku_logic.generate_puzzle(clues=40)

    assert_valid_solution(solution)
    assert sudoku_logic.count_solutions(copy.deepcopy(puzzle)) == 1
    assert all(
        puzzle[row][col] in (sudoku_logic.EMPTY, solution[row][col])
        for row in range(sudoku_logic.SIZE)
        for col in range(sudoku_logic.SIZE)
    )
    assert sum(cell != sudoku_logic.EMPTY for row in puzzle for cell in row) == 40
    assert puzzle is not solution


def test_index_route_renders_game_page(client):
    response = client.get('/')

    assert response.status_code == 200
    assert b'Sudoku Game' in response.data
    assert b'id="sudoku-board"' in response.data


def test_new_route_generates_and_stores_game(client):
    response = client.get('/new?clues=45')
    payload = response.get_json()

    assert response.status_code == 200
    assert set(payload) == {'puzzle'}
    assert sum(cell != sudoku_logic.EMPTY for row in payload['puzzle'] for cell in row) == 45
    assert app_module.CURRENT['puzzle'] == payload['puzzle']
    assert_valid_solution(app_module.CURRENT['solution'])


def test_check_route_requires_game_in_progress(client):
    response = client.post('/check', json={'board': sudoku_logic.create_empty_board()})

    assert response.status_code == 400
    assert response.get_json() == {'error': 'No game in progress'}


def test_check_route_returns_no_incorrect_cells_for_solution(client):
    client.get('/new')

    response = client.post('/check', json={'board': app_module.CURRENT['solution']})

    assert response.status_code == 200
    assert response.get_json() == {'incorrect': []}


def test_check_route_reports_incorrect_coordinates(client):
    client.get('/new')
    board = copy.deepcopy(app_module.CURRENT['solution'])
    board[0][0] = (board[0][0] % sudoku_logic.SIZE) + 1

    response = client.post('/check', json={'board': board})

    assert response.status_code == 200
    assert response.get_json() == {'incorrect': [[0, 0]]}
