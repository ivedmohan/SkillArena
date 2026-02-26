"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  cloneGrid,
  isCorrectPlacement,
  isSolved,
  countEmpty,
} from "./sudokuLogic";

/**
 * SudokuGame — Grid-based plugin.
 *
 * Player fills empty cells (shown as 0 in the grid).
 * Correct fill → onCorrect(pointsPerCell)
 * Wrong fill   → onWrong() + cell turns red briefly
 * All filled   → onComplete()
 */
export default function SudokuGame({ config, onCorrect, onWrong, onComplete, isActive }) {
  // Pick puzzle by difficulty stored in sessionStorage, fallback to first
  const difficulty = (typeof window !== "undefined" && sessionStorage.getItem("difficulty")) || "easy";
  const puzzles = config.config.puzzles;
  const puzzle = puzzles.find(p => p.difficulty === difficulty) ?? puzzles[0];
  const originalGrid = puzzle.grid;
  const solution = puzzle.solution;
  const pointsPerCell = puzzle.pointsPerCell ?? 5;

  const [grid, setGrid] = useState(() => cloneGrid(originalGrid));
  const [selected, setSelected] = useState(null); // { row, col }
  const [errors, setErrors] = useState(new Set()); // "r,c" keys
  const [solved, setSolved] = useState(false);

  const totalEmpty = countEmpty(originalGrid);

  function selectCell(r, c) {
    if (!isActive || solved || originalGrid[r][c] !== 0) return;
    setSelected({ row: r, col: c });
  }

  function inputNumber(n) {
    if (!selected || !isActive || solved) return;
    const { row, col } = selected;
    if (originalGrid[row][col] !== 0) return; // pre-filled

    const correct = isCorrectPlacement(solution, row, col, n);
    const newGrid = cloneGrid(grid);
    newGrid[row][col] = n;
    setGrid(newGrid);

    const key = `${row},${col}`;
    if (correct) {
      setErrors(prev => { const s = new Set(prev); s.delete(key); return s; });
      onCorrect(pointsPerCell);
      // Check win condition
      if (isSolved(newGrid, solution, originalGrid)) {
        setSolved(true);
        onComplete();
      }
    } else {
      setErrors(prev => new Set([...prev, key]));
      onWrong();
      // Clear wrong after animation
      setTimeout(() => {
        setGrid(g => {
          const g2 = cloneGrid(g);
          g2[row][col] = 0;
          return g2;
        });
        setErrors(prev => { const s = new Set(prev); s.delete(key); return s; });
      }, 800);
    }
  }

  function clearCell() {
    if (!selected || !isActive) return;
    const { row, col } = selected;
    if (originalGrid[row][col] !== 0) return;
    const newGrid = cloneGrid(grid);
    newGrid[row][col] = 0;
    setGrid(newGrid);
    const key = `${row},${col}`;
    setErrors(prev => { const s = new Set(prev); s.delete(key); return s; });
  }

  // Keyboard input
  useEffect(() => {
    if (!isActive) return;
    function onKey(e) {
      const n = parseInt(e.key);
      if (!isNaN(n) && n >= 1 && n <= 9) inputNumber(n);
      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") clearCell();
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, selected, grid]); // eslint-disable-line

  const getBox = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);
  const selBox = selected ? getBox(selected.row, selected.col) : -1;

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full">
      {solved && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-2xl font-black text-[#00ff88] drop-shadow-[0_0_15px_rgba(0,255,136,0.7)]"
        >
          Puzzle Solved! 🎉
        </motion.div>
      )}

      {/* Progress */}
      <div className="text-xs text-[#8888aa] font-mono">
        {countFilledCells(grid, originalGrid)} / {totalEmpty} cells filled
      </div>

      {/* Grid */}
      <div
        className="grid gap-0 border-2 border-[#b44fff] rounded-xl overflow-hidden"
        style={{ gridTemplateColumns: "repeat(9, 1fr)", width: "min(360px, 100vw - 32px)" }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isOriginal = originalGrid[r][c] !== 0;
            const isSelected = selected?.row === r && selected?.col === c;
            const isSameRow = selected?.row === r;
            const isSameCol = selected?.col === c;
            const isSameBox = selected && getBox(r, c) === selBox;
            const key = `${r},${c}`;
            const isError = errors.has(key);
            const rightBorder = (c + 1) % 3 === 0 && c < 8;
            const bottomBorder = (r + 1) % 3 === 0 && r < 8;

            return (
              <button
                key={key}
                onClick={() => selectCell(r, c)}
                className={`flex items-center justify-center font-bold text-sm aspect-square transition-colors select-none
                  ${rightBorder ? "border-r-2 border-r-[#b44fff40]" : "border-r border-r-[#2a2a4a]"}
                  ${bottomBorder ? "border-b-2 border-b-[#b44fff40]" : "border-b border-b-[#2a2a4a]"}
                  ${isSelected ? "bg-[#b44fff40]" :
                    isError ? "bg-[#ff009920]" :
                    (isSameRow || isSameCol || isSameBox) ? "bg-[#ffffff08]" :
                    "bg-[#0f0f1a]"}
                `}
                style={{ height: "calc((min(360px, 100vw - 32px)) / 9)" }}
              >
                <span className={
                  isError ? "text-[#ff0099]" :
                  isOriginal ? "text-white font-black" :
                  "text-[#b44fff]"
                }>
                  {cell !== 0 ? cell : ""}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Number pad */}
      {!solved && (
        <div className="grid grid-cols-5 gap-2 w-full max-w-[300px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => inputNumber(n)}
              disabled={!selected || !isActive}
              className="aspect-square rounded-xl bg-[#ffffff08] border border-[#2a2a4a] text-white font-black text-lg hover:border-[#b44fff] hover:bg-[#b44fff20] transition-all disabled:opacity-30"
            >
              {n}
            </button>
          ))}
          <button
            onClick={clearCell}
            disabled={!selected || !isActive}
            className="aspect-square rounded-xl bg-[#ffffff08] border border-[#2a2a4a] text-[#ff0099] font-bold text-xs hover:border-[#ff0099] transition-all disabled:opacity-30"
          >
            DEL
          </button>
        </div>
      )}

      {selected && !solved && (
        <p className="text-xs text-[#444466]">
          Row {selected.row + 1}, Col {selected.col + 1} selected
        </p>
      )}
    </div>
  );
}

function countFilledCells(playerGrid, originalGrid) {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (originalGrid[r][c] === 0 && playerGrid[r][c] !== 0) count++;
    }
  }
  return count;
}
