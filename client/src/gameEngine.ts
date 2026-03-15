import { Board, Move, Player, Position, GameStatus } from './types';

const BOARD_SIZE = 8;

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) {
          board[row][col] = { player: 'black', isKing: false };
        } else if (row > 4) {
          board[row][col] = { player: 'red', isKing: false };
        }
      }
    }
  }

  return board;
}

function isInBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

function getSimpleMoves(board: Board, pos: Position): Move[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const directions: number[] = [];
  if (piece.player === 'red' || piece.isKing) directions.push(-1);
  if (piece.player === 'black' || piece.isKing) directions.push(1);

  const moves: Move[] = [];

  for (const dRow of directions) {
    for (const dCol of [-1, 1]) {
      const to: Position = { row: pos.row + dRow, col: pos.col + dCol };
      if (isInBounds(to) && board[to.row][to.col] === null) {
        moves.push({ from: pos, to });
      }
    }
  }

  return moves;
}

function getCaptureMoves(board: Board, pos: Position): Move[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const directions: number[] = [];
  if (piece.player === 'red' || piece.isKing) directions.push(-1);
  if (piece.player === 'black' || piece.isKing) directions.push(1);

  const moves: Move[] = [];

  for (const dRow of directions) {
    for (const dCol of [-1, 1]) {
      const mid: Position = { row: pos.row + dRow, col: pos.col + dCol };
      const to: Position = { row: pos.row + 2 * dRow, col: pos.col + 2 * dCol };

      if (
        isInBounds(to) &&
        board[mid.row][mid.col] !== null &&
        board[mid.row][mid.col]!.player !== piece.player &&
        board[to.row][to.col] === null
      ) {
        moves.push({ from: pos, to, captured: mid });
      }
    }
  }

  return moves;
}

export function getValidMoves(board: Board, player: Player): Move[] {
  const allCaptures: Move[] = [];
  const allSimple: Move[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.player === player) {
        const pos = { row, col };
        allCaptures.push(...getCaptureMoves(board, pos));
        allSimple.push(...getSimpleMoves(board, pos));
      }
    }
  }

  // Captures are mandatory
  return allCaptures.length > 0 ? allCaptures : allSimple;
}

export function getMovesForPiece(board: Board, pos: Position, player: Player): Move[] {
  const allMoves = getValidMoves(board, player);
  return allMoves.filter(m => m.from.row === pos.row && m.from.col === pos.col);
}

export function applyMove(board: Board, move: Move): { newBoard: Board; promoted: boolean; chainCaptures: Move[] } {
  const newBoard = board.map(row => row.map(cell => (cell ? { ...cell } : null)));
  const piece = newBoard[move.from.row][move.from.col]!;

  newBoard[move.to.row][move.to.col] = piece;
  newBoard[move.from.row][move.from.col] = null;

  if (move.captured) {
    newBoard[move.captured.row][move.captured.col] = null;
  }

  // Check promotion
  let promoted = false;
  if (!piece.isKing) {
    if ((piece.player === 'red' && move.to.row === 0) || (piece.player === 'black' && move.to.row === BOARD_SIZE - 1)) {
      newBoard[move.to.row][move.to.col] = { ...piece, isKing: true };
      promoted = true;
    }
  }

  // Check for chain captures (only if this was a capture and piece didn't just promote)
  let chainCaptures: Move[] = [];
  if (move.captured && !promoted) {
    chainCaptures = getCaptureMoves(newBoard, move.to);
  }

  return { newBoard, promoted, chainCaptures };
}

export function getGameStatus(board: Board, currentPlayer: Player): GameStatus {
  const validMoves = getValidMoves(board, currentPlayer);
  if (validMoves.length === 0) {
    return currentPlayer === 'red' ? 'black-wins' : 'red-wins';
  }

  let redCount = 0;
  let blackCount = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell?.player === 'red') redCount++;
      if (cell?.player === 'black') blackCount++;
    }
  }

  if (redCount === 0) return 'black-wins';
  if (blackCount === 0) return 'red-wins';

  return 'playing';
}

export function countPieces(board: Board): { red: number; black: number } {
  let red = 0;
  let black = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell?.player === 'red') red++;
      if (cell?.player === 'black') black++;
    }
  }
  return { red, black };
}
