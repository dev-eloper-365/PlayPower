-- Add stream column to quizzes (nullable) for grades 11-12
ALTER TABLE quizzes ADD COLUMN stream TEXT;

-- Optional index to help filtering by subject/grade/stream
CREATE INDEX IF NOT EXISTS idx_quizzes_stream ON quizzes(stream);


