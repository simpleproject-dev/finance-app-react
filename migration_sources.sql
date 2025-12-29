-- Membuat tabel sources
CREATE TABLE IF NOT EXISTS sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'cash', 'debit', 'e-wallet', dll
  color VARCHAR(7), -- untuk warna tampilan (format hex)
  icon VARCHAR(50), -- nama icon untuk tampilan
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menambahkan kolom source_id ke tabel transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES sources(id);

-- Membuat index untuk performansi
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source_id ON transactions(source_id);

-- Fungsi trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Menambahkan trigger ke tabel sources
CREATE TRIGGER update_sources_updated_at 
    BEFORE UPDATE ON sources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();