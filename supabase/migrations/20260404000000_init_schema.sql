-- 1. Create Tables
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_stock NUMERIC(10, 2) DEFAULT 0,
    min_stock NUMERIC(10, 2) DEFAULT 0,
    price_per_unit NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    amount_needed NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    change_amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'usage', 'adjustment')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create RPC for Atomic Stock Reduction (The "Transaction")
-- Fungsi ini menghandle pencarian resep, pengurangan stok, dan logging dalam satu transaksi atomik.
CREATE OR REPLACE FUNCTION process_sale_stock(
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS VOID AS $$
DECLARE
    r RECORD;
BEGIN
    -- Loop melalui resep produk tersebut
    FOR r IN (
        SELECT ingredient_id, amount_needed 
        FROM recipes 
        WHERE product_id = p_product_id
    ) LOOP
        -- 1. Kurangi stok bahan baku
        UPDATE ingredients
        SET current_stock = current_stock - (r.amount_needed * p_quantity)
        WHERE id = r.ingredient_id;

        -- 2. Cek apakah stok negatif
        IF (SELECT current_stock FROM ingredients WHERE id = r.ingredient_id) < 0 THEN
            RAISE EXCEPTION 'Stok tidak mencukupi untuk bahan baku ID: %', r.ingredient_id;
        END IF;

        -- 3. Catat ke inventory_logs
        INSERT INTO inventory_logs (ingredient_id, change_amount, type, reason)
        VALUES (
            r.ingredient_id, 
            -(r.amount_needed * p_quantity), 
            'usage', 
            'Penjualan produk ' || p_product_id || ' x' || p_quantity
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
