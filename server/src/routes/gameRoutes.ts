import express from 'express';
import { createGame, getGameState, makeMove } from '../services/gameService';
import { CreateGameDto, MoveDto } from '../models/game';

const router = express.Router();

router.post('/games', async (req, res, next) => {
  try {
    const { playerX, playerO } = req.body as CreateGameDto;
    if (!playerX || !playerO) {
      return res
        .status(400)
        .json({ error: 'playerX and playerO are required' });
    }
    const state = await createGame({ playerX, playerO });
    res.status(201).json(state);
  } catch (err) {
    next(err);
  }
});

router.get('/games/:id', (req, res) => {
  const { id } = req.params;
  const state = getGameState(id);
  if (!state) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(state);
});

router.post('/games/:id/moves', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { row, col } = req.body as MoveDto;
    if (row === undefined || col === undefined) {
      return res
        .status(400)
        .json({ error: 'row and col are required in request body' });
    }
    const state = await makeMove(id, { row, col });
    res.json(state);
  } catch (err: any) {
    if (err.message === 'Game not found') {
      return res.status(404).json({ error: err.message });
    }
    if (
      err.message === 'Invalid row or column' ||
      err.message === 'Cell is already occupied'
    ) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

export default router;
