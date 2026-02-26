/**
 * sudokuLogic.js — Pure Sudoku validation logic.
 */

/** Deep clone a 2D grid. */
export function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

/** Check if placing `value` at (row, col) matches the solution. */
export function isCorrectPlacement(solution, row, col, value) {
  return solution[row][col] === value;
}

/** Check if all empty cells (original 0s) are filled correctly. */
export function isSolved(playerGrid, solution, originalGrid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (originalGrid[r][c] === 0 && playerGrid[r][c] !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}

/** Get total number of empty cells in the original puzzle. */
export function countEmpty(grid) {
  return grid.flat().filter(v => v === 0).length;
}

/** Count how many cells the player has filled (non-zero where original was 0). */
export function countFilled(playerGrid, originalGrid) {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (originalGrid[r][c] === 0 && playerGrid[r][c] !== 0) count++;
    }
  }
  return count;
}
