-- Insert sample products for testing
-- Replace 'YOUR_USER_ID' with your actual user ID

INSERT INTO public.products (user_id, name, description, price, category, is_available) VALUES
-- Hamburguesas
('YOUR_USER_ID', 'Big Momma', 'Nuestra hamburguesa estrella con doble carne, queso cheddar, lechuga, tomate y papas fritas', 12500.00, 'Hamburguesas', true),
('YOUR_USER_ID', 'Classic Burger', 'Hamburguesa clásica con carne, queso, lechuga y tomate', 9500.00, 'Hamburguesas', true),
('YOUR_USER_ID', 'Cheeseburger Deluxe', 'Hamburguesa con doble queso, cebolla caramelizada y salsa especial', 11000.00, 'Hamburguesas', true),

-- Lomos
('YOUR_USER_ID', 'Lomo Completo', 'Nuestro famoso lomo gigante con jamón, queso, lechuga, tomate, huevo y papas fritas', 15000.00, 'Lomos', true),
('YOUR_USER_ID', 'Lomo Simple', 'Lomo con jamón, queso y papas fritas', 12000.00, 'Lomos', true),
('YOUR_USER_ID', 'Lomo Especial', 'Lomo con jamón, queso, lechuga, tomate, huevo, panceta y papas fritas', 17000.00, 'Lomos', true),

-- Milanesas
('YOUR_USER_ID', 'Milanesa Napolitana', 'Milanesa gigante con jamón, queso, salsa de tomate y papas fritas', 14000.00, 'Milanesas', true),
('YOUR_USER_ID', 'Milanesa Simple', 'Milanesa de carne con papas fritas', 11000.00, 'Milanesas', true),
('YOUR_USER_ID', 'Milanesa de Pollo', 'Milanesa de pollo con ensalada mixta', 12000.00, 'Milanesas', true),

-- Bebidas
('YOUR_USER_ID', 'Coca Cola', 'Gaseosa Coca Cola 500ml', 2500.00, 'Bebidas', true),
('YOUR_USER_ID', 'Agua Mineral', 'Agua mineral sin gas 500ml', 2000.00, 'Bebidas', true),
('YOUR_USER_ID', 'Cerveza Quilmes', 'Cerveza Quilmes 473ml', 3500.00, 'Bebidas', true),

-- Mediatardes
('YOUR_USER_ID', 'Tostado Mixto', 'Tostado de jamón y queso', 4500.00, 'Mediatardes', true),
('YOUR_USER_ID', 'Medialunas', 'Docena de medialunas con dulce de leche', 3000.00, 'Mediatardes', true),
('YOUR_USER_ID', 'Café con Leche', 'Café con leche en jarrito', 2800.00, 'Mediatardes', true);

-- Note: You need to replace 'YOUR_USER_ID' with your actual user ID from the auth.users table