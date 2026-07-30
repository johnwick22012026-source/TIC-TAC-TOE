export type PlayerSymbol = 'X' | 'O';

export interface GameState {
  id: string;
  playerX: string;
  playerO: string;
  board: (PlayerSymbol | null)[][];
  currentPlayer: PlayerSymbol;
  movesCount: number;
  gameOver: boolean;
  winner: PlayerSymbol | null;
}

export interface CreateGameDto {
  playerX: string;
  playerO: string;
}

export interface MoveDto {
  row: number;
  col: number;
}
