export type Player = 'red' | 'black';

export interface Piece {
  player: Player;
  isKing: boolean;
}

export type Cell = Piece | null;

export type Board = Cell[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Position;
}

export type GameStatus = 'playing' | 'red-wins' | 'black-wins' | 'draw';
