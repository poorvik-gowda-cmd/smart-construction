-- Add payment columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS payment_qr_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING';

-- Ensure file_type 'QUOTATION' is supported (it already is based on my code check, but good to have context)
-- We can also add an index for performance when filtering by status on dashboard
CREATE INDEX IF NOT EXISTS idx_documents_payment_status ON documents(payment_status);
