-- Add level column with default value 0
ALTER TABLE cards ADD COLUMN level INTEGER NOT NULL DEFAULT 0;

-- Add next_repeat column (without NOT NULL constraint to allow CURRENT_TIMESTAMP default)
ALTER TABLE cards ADD COLUMN next_repeat DATETIME DEFAULT CURRENT_TIMESTAMP; 