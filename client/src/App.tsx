import { useState, useCallback } from 'react';
import { Board as BoardType, Player, Position, Move, GameStatus } from './types';
import { createInitialBoard, getMovesForPiece, applyMove, getGameStatus, countPieces } from './gameEngine';

function App() {
  const [board, setBoard] = useState<BoardType>(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('red');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [chainCapture, setChainCapture] = useState<Position | null>(null);

  const executeMove = useCallback((move: Move, currentBoard: BoardType, player: Player) => {
    const { newBoard, chainCaptures } = applyMove(currentBoard, move);
    setBoard(newBoard);

    if (chainCaptures.length > 0) {
      setChainCapture(move.to);
      setSelectedPos(move.to);
      setValidMoves(chainCaptures);
    } else {
      const nextPlayer: Player = player === 'red' ? 'black' : 'red';
      const status = getGameStatus(newBoard, nextPlayer);
      setCurrentPlayer(nextPlayer);
      setGameStatus(status);
      setSelectedPos(null);
      setValidMoves([]);
      setChainCapture(null);
    }
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing') return;

    const clickedPiece = board[row][col];

    if (chainCapture) {
      const move = validMoves.find(m => m.to.row === row && m.to.col === col);
      if (move) {
        executeMove(move, board, currentPlayer);
      }
      return;
    }

    if (selectedPos) {
      const move = validMoves.find(m => m.to.row === row && m.to.col === col);
      if (move) {
        executeMove(move, board, currentPlayer);
        return;
      }
    }

    if (clickedPiece && clickedPiece.player === currentPlayer) {
      const pos = { row, col };
      const moves = getMovesForPiece(board, pos, currentPlayer);
      if (moves.length > 0) {
        setSelectedPos(pos);
        setValidMoves(moves);
      } else {
        setSelectedPos(null);
        setValidMoves([]);
      }
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  }, [board, currentPlayer, selectedPos, validMoves, gameStatus, chainCapture, executeMove]);

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setCurrentPlayer('red');
    setSelectedPos(null);
    setValidMoves([]);
    setGameStatus('playing');
    setChainCapture(null);
  }, []);

  const pieces = countPieces(board);

  const isValidTarget = (row: number, col: number) =>
    validMoves.some(m => m.to.row === row && m.to.col === col);

  const isSelected = (row: number, col: number) =>
    selectedPos?.row === row && selectedPos?.col === col;

  const statusMessage = () => {
    switch (gameStatus) {
      case 'red-wins': return '¡Rojas ganan!';
      case 'black-wins': return '¡Negras ganan!';
      case 'draw': return '¡Empate!';
      default: return currentPlayer === 'red' ? 'Turno: Rojas' : 'Turno: Negras';
    }
  };

  return (
    <div className="app">
      <h1>Juego de Damas</h1>

      <div className="game-info">
        <div className={`player-info ${currentPlayer === 'red' && gameStatus === 'playing' ? 'active' : ''}`}>
          <div className="piece-preview red-preview" />
          <span>Rojas: {pieces.red}</span>
        </div>
        <div className={`status ${gameStatus !== 'playing' ? 'game-over' : ''}`}>
          {statusMessage()}
        </div>
        <div className={`player-info ${currentPlayer === 'black' && gameStatus === 'playing' ? 'active' : ''}`}>
          <div className="piece-preview black-preview" />
          <span>Negras: {pieces.black}</span>
        </div>
      </div>

      <div className="board">
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="board-row">
            {row.map((cell, colIdx) => {
              const isDark = (rowIdx + colIdx) % 2 === 1;
              const selected = isSelected(rowIdx, colIdx);
              const target = isValidTarget(rowIdx, colIdx);

              return (
                <div
                  key={colIdx}
                  className={`cell ${isDark ? 'dark' : 'light'} ${selected ? 'selected' : ''} ${target ? 'valid-target' : ''}`}
                  onClick={() => isDark ? handleCellClick(rowIdx, colIdx) : undefined}
                >
                  {cell && (
                    <div className={`piece ${cell.player} ${cell.isKing ? 'king' : ''}`}>
                      {cell.isKing && <span className="crown">♛</span>}
                    </div>
                  )}
                  {target && !cell && <div className="move-hint" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {gameStatus !== 'playing' && (
        <button className="reset-btn" onClick={resetGame}>
          Nueva Partida
        </button>
      )}
      <button className="reset-btn secondary" onClick={resetGame}>
        Reiniciar
      </button>
    </div>
  );
}

export default App;
