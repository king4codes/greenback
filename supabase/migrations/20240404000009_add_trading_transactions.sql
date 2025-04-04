-- Create trading transactions table
CREATE TABLE IF NOT EXISTS trading_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_token VARCHAR(50) NOT NULL,
    to_token VARCHAR(50) NOT NULL,
    from_amount DECIMAL(18, 9) NOT NULL,
    to_amount DECIMAL(18, 9) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_trading_transactions_user_id ON trading_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_transactions_status ON trading_transactions(status);
CREATE INDEX IF NOT EXISTS idx_trading_transactions_created_at ON trading_transactions(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trading_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trading_transactions_updated_at
    BEFORE UPDATE ON trading_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_trading_transactions_updated_at(); 