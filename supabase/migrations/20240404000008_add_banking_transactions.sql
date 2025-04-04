-- Create banking transactions table
CREATE TABLE IF NOT EXISTS banking_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'lend', 'borrow')),
    amount DECIMAL(18, 9) NOT NULL,
    asset VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_banking_transactions_user_id ON banking_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_banking_transactions_type ON banking_transactions(type);
CREATE INDEX IF NOT EXISTS idx_banking_transactions_status ON banking_transactions(status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_banking_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER banking_transactions_updated_at
    BEFORE UPDATE ON banking_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_banking_transactions_updated_at(); 