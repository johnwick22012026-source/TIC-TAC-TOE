import { randomUUID } from 'crypto';
import { prisma } from '../prismaClient';
import { PlayerSymbol, GameState, CreateGameDto, MoveDto } from '../models/game';

interface Session {
  id: string;
  playerX: string;
  playerO: string;
  board: (PlayerSymbol | null)[][];
  currentPlayer: PlayerSymbol;
  movesCount: number;
}

const sessions = new Map<string, Session>();

function initializeBoard(): (PlayerSymbol | null)[][] {
  return Array.from({ length: 3 }, () => Array<PlayerSymbol | null>(3).fill(null));
}

function checkWinner(board: (PlayerSymbol | null)[][]): PlayerSymbol | null {
  const lines = [
    // rows
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    // columns
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    // diagonals
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    const v1 = board[a[0]][a[1]];
    if (v1 && v1 === board[b[0]][b[1]] && v1 === board[c[0]][c[1]]) {
      return v1;
    }
  }
  return null;
}

export async function createGame(dto: CreateGameDto): Promise<GameState> {
  const id = randomUUID();
  const session: Session = {
    id,
    playerX: dto.playerX,
    playerO: dto.playerO,
    board: initializeBoard(),
    currentPlayer: 'X',
    movesCount: 0,
  };
  sessions.set(id, session);

  return {
    id: session.id,
    playerX: session.playerX,
    playerO: session.playerO,
    board: session.board,
    currentPlayer: session.currentPlayer,
    movesCount: session.movesCount,
    gameOver: false,
    winner: null,
  };
}

export function getGameState(id: string): GameState | null {
  const session = sessions.get(id);
  if (!session) {
    return null;
  }
  return {
    id: session.id,
    playerX: session.playerX,
    playerO: session.playerO,
    board: session.board,
    currentPlayer: session.currentPlayer,
    movesCount: session.movesCount,
    gameOver: false,
    winner: null,
  };
}

export async function makeMove(id: string, dto: MoveDto): Promise<GameState> {
  const session = sessions.get(id);
  if (!session) {
    throw new Error('Game not found');
  }

  const { row, col } = dto;
  if (
    row === undefined ||
    col === undefined ||
    row < 0 ||
    row > 2 ||
    col < 0 ||
    col > 2
  ) {
    throw new Error('Invalid row or column');
  }

  if (session.board[row][col] !== null) {
    throw new Error('Cell is already occupied');
  }

  session.board[row][col] = session.currentPlayer;
  session.movesCount += 1;

  const winner = checkWinner(session.board);
  if (winner) {
    // game over with a winner
    await prisma.completedGame.create({
      data: {
        playerX: session.playerX,
        playerO: session.playerO,
        winner,
        finalBoardState: session.board,
        movesCount: session.movesCount,
      },
    });
    sessions.delete(id);

    return {
      id: session.id,
      playerX: session.playerX,
      playerO: session.playerO,
      board: session.board,
      currentPlayer: session.currentPlayer,
      movesCount: session.movesCount,
      gameOver: true,
      winner,
    };
  }

  if (session.movesCount >= 9) {
    // game over with draw
    await prisma.completedGame.create({
      data: {
        playerX: session.playerX,
        playerO: session.playerO,
        winner: null,
        finalBoardState: session.board,
        movesCount: session.movesCount,
      },
    });
    sessions.delete(id);

    return {
      id: session.id,
      playerX: session.playerX,
      playerO: session.playerO,
      board: session.board,
      currentPlayer: session.currentPlayer,
      movesCount: session.movesCount,
      gameOver: true,
      winner: null,
    };
  }

  // continue game
  session.currentPlayer = session.currentPlayer === 'X' ? 'O' : 'X';

  return {
    id: session.id,
    playerX: session.playerX,
    playerO: session.playerO,
    board: session.board,
    currentPlayer: session.currentPlayer,
    movesCount: session.movesCount,
    gameOver: false,
    winner: null,
  };
}
