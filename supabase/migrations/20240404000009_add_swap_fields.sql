-- Add new columns for swap functionality
ALTER TABLE banking_transactions
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS gbc_amount DECIMAL(18, 9);

-- Add index for signature lookups
CREATE INDEX IF NOT EXISTS idx_banking_transactions_signature ON banking_transactions(signature);

-- Add constraint to ensure signature is unique when present
ALTER TABLE banking_transactions
ADD CONSTRAINT unique_signature UNIQUE (signature); 