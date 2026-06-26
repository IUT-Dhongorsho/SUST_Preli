-- Database schema for QueueStorm Investigator ticket logs

CREATE TABLE IF NOT EXISTS ticket_logs (
  id           SERIAL PRIMARY KEY,
  ticket_id    TEXT NOT NULL,
  request      JSONB NOT NULL,
  response     JSONB NOT NULL,
  latency_ms   INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_logs_ticket_id ON ticket_logs (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_logs_created_at ON ticket_logs (created_at);
