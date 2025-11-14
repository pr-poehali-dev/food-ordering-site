-- Create menu items table
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255),
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'новый',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category) VALUES
('Борщ классический', 'Традиционный украинский борщ со сметаной', 350.00, 'Супы'),
('Цезарь с курицей', 'Свежий салат с курицей гриль, пармезаном и сухариками', 450.00, 'Салаты'),
('Стейк Рибай', 'Сочный стейк из мраморной говядины 250г', 1200.00, 'Горячее'),
('Паста Карбонара', 'Классическая итальянская паста с беконом', 550.00, 'Паста');
