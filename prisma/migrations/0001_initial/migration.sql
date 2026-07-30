-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create table for completed game results
CREATE TABLE completed_game (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  player_x TEXT NOT NULL,
  player_o TEXT NOT NULL,
  winner TEXT,
  final_board_state JSONB NOT NULL,
  moves_count INTEGER NOT NULL
);

-- Create a materialized view to aggregate scoreboard stats by player
CREATE MATERIALIZED VIEW scoreboard_summary AS
  SELECT
    player,
    COUNT(*) FILTER (WHERE winner = player) AS wins,
    COUNT(*) FILTER (WHERE winner IS NULL)   AS draws,
    COUNT(*) AS games_played
  FROM (
    SELECT player_x AS player, winner FROM completed_game
    UNION ALL
    SELECT player_o AS player, winner FROM completed_game
  ) sub
  GROUP BY player;

-- Index to speed up lookups on the scoreboard summary
CREATE INDEX ON scoreboard_summary(player);
