const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Создать роли если нет
pool.query(`INSERT INTO roles (role_name) VALUES ('admin'), ('user') ON CONFLICT (role_name) DO NOTHING;`);

// Создать админа по умолчанию
const createAdmin = async () => {
  const hashedPass = await bcrypt.hash('admin123', 10);
  await pool.query(`INSERT INTO users (role_id, phone, password, email) VALUES (1, '12345678901', $1, 'admin@shop.ru') ON CONFLICT (email) DO NOTHING;`, [hashedPass]);
};
createAdmin();

// Helper: Update order total
const updateOrderTotal = async (orderId) => {
  const result = await pool.query(`
    SELECT SUM(p.price * c.quantity * (1 - COALESCE(d.discount_value, 0)/100)) AS total
    FROM cart c
    JOIN products p ON c.products_id = p.ID_products
    LEFT JOIN discounts d ON p.discount_id = d.ID_discount
    WHERE c.orders_id = $1
  `, [orderId]);
  const total = result.rows[0].total || 0;
  await pool.query('UPDATE orders SET total_amount = $1 WHERE ID_orders = $2', [total, orderId]);
};

// ROLES CRUD
app.get('/roles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/roles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM roles WHERE ID_role = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/roles', async (req, res) => {
  const { role_name } = req.body;
  try {
    const result = await pool.query('INSERT INTO roles (role_name) VALUES ($1) RETURNING *', [role_name]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/roles/:id', async (req, res) => {
  const { id } = req.params;
  const { role_name } = req.body;
  try {
    const result = await pool.query('UPDATE roles SET role_name = $1 WHERE ID_role = $2 RETURNING *', [role_name, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/roles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM roles WHERE ID_role = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// USERS CRUD
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.ID_role');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.ID_role WHERE ID_users = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/users', async (req, res) => {
  const { role_id, phone, password, email } = req.body;
  const hashedPass = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query('INSERT INTO users (role_id, phone, password, email) VALUES ($1, $2, $3, $4) RETURNING *', [role_id, phone, hashedPass, email]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role_id, phone, password, email } = req.body;
  const hashedPass = password ? await bcrypt.hash(password, 10) : undefined;
  try {
    const result = await pool.query(
      'UPDATE users SET role_id = $1, phone = $2, password = COALESCE($3, password), email = $4 WHERE ID_users = $5 RETURNING *',
      [role_id, phone, hashedPass, email, id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE ID_users = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CATEGORIES CRUD
app.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM categories WHERE ID_category = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/categories', async (req, res) => {
  const { category_name } = req.body;
  try {
    const result = await pool.query('INSERT INTO categories (category_name) VALUES ($1) RETURNING *', [category_name]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { category_name } = req.body;
  try {
    const result = await pool.query('UPDATE categories SET category_name = $1 WHERE ID_category = $2 RETURNING *', [category_name, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM categories WHERE ID_category = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DISCOUNTS CRUD
app.get('/discounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM discounts');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/discounts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM discounts WHERE ID_discount = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/discounts', async (req, res) => {
  const { discount_name, discount_value, user_id } = req.body;
  try {
    const result = await pool.query('INSERT INTO discounts (discount_name, discount_value, user_id) VALUES ($1, $2, $3) RETURNING *', [discount_name, discount_value, user_id || null]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/discounts/:id', async (req, res) => {
  const { id } = req.params;
  const { discount_name, discount_value, user_id } = req.body;
  try {
    const result = await pool.query('UPDATE discounts SET discount_name = $1, discount_value = $2, user_id = $3 WHERE ID_discount = $4 RETURNING *', [discount_name, discount_value, user_id || null, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/discounts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM discounts WHERE ID_discount = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PRODUCTS CRUD
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT p.*, d.discount_value, c.category_name FROM products p LEFT JOIN discounts d ON p.discount_id = d.ID_discount LEFT JOIN categories c ON p.category_id = c.ID_category');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT p.*, d.discount_value, c.category_name FROM products p LEFT JOIN discounts d ON p.discount_id = d.ID_discount LEFT JOIN categories c ON p.category_id = c.ID_category WHERE p.ID_products = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/products', async (req, res) => {
  const { discount_id, category_id, product_name, price, weight, picture_url } = req.body;
  let finalDiscountId = discount_id;
  try {
    if (!discount_id && Math.random() < 0.3) {
      const discResult = await pool.query('INSERT INTO discounts (discount_name, discount_value, user_id) VALUES ($1, $2, $3) RETURNING ID_discount', ['Random Discount', 10, null]);
      finalDiscountId = discResult.rows[0].id_discount;
    }
    const result = await pool.query('INSERT INTO products (discount_id, category_id, product_name, price, weight, picture_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [finalDiscountId || null, category_id, product_name, price, weight, picture_url]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { discount_id, category_id, product_name, price, weight, picture_url } = req.body;
  try {
    const result = await pool.query('UPDATE products SET discount_id = $1, category_id = $2, product_name = $3, price = $4, weight = $5, picture_url = $6 WHERE ID_products = $7 RETURNING *', [discount_id || null, category_id, product_name, price, weight, picture_url, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE ID_products = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ORDERS CRUD
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE ID_orders = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/orders', async (req, res) => {
  const { user_id, total_amount } = req.body;
  try {
    const result = await pool.query('INSERT INTO orders (user_id, orders_date, total_amount) VALUES ($1, NOW(), $2) RETURNING *', [user_id, total_amount || 0]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id, total_amount } = req.body;
  try {
    const result = await pool.query('UPDATE orders SET user_id = $1, total_amount = $2 WHERE ID_orders = $3 RETURNING *', [user_id, total_amount, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM orders WHERE ID_orders = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CART CRUD
app.get('/cart', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cart');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/cart/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM cart WHERE ID_cart = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/cart', async (req, res) => {
  const { orders_id, products_id, quantity } = req.body;
  try {
    const result = await pool.query('INSERT INTO cart (orders_id, products_id, quantity) VALUES ($1, $2, $3) RETURNING *', [orders_id, products_id, quantity]);
    await updateOrderTotal(orders_id);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/cart/:id', async (req, res) => {
  const { id } = req.params;
  const { orders_id, products_id, quantity } = req.body;
  try {
    const result = await pool.query('UPDATE cart SET orders_id = $1, products_id = $2, quantity = $3 WHERE ID_cart = $4 RETURNING *', [orders_id, products_id, quantity, id]);
    await updateOrderTotal(orders_id);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/cart/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const orderResult = await pool.query('SELECT orders_id FROM cart WHERE ID_cart = $1', [id]);
    const orders_id = orderResult.rows[0]?.orders_id;
    await pool.query('DELETE FROM cart WHERE ID_cart = $1', [id]);
    if (orders_id) await updateOrderTotal(orders_id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/cart/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    // Find latest active order
    const activeOrder = await pool.query(`
      SELECT ID_orders FROM orders 
      WHERE user_id = $1 AND ID_orders NOT IN (SELECT orders_id FROM payments) 
      ORDER BY orders_date DESC LIMIT 1
    `, [user_id]);
    if (activeOrder.rows.length === 0) return res.json([]);
    
    const orderId = activeOrder.rows[0].id_orders;
    const result = await pool.query(`
      SELECT o.ID_orders, c.quantity, p.ID_products AS product_id, p.product_name, p.price 
      FROM orders o 
      JOIN cart c ON o.ID_orders = c.orders_id 
      JOIN products p ON c.products_id = p.ID_products 
      WHERE o.ID_orders = $1
    `, [orderId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching cart' });
  }
});

// Add/update item to cart
app.post('/api/cart', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  try {
    // Find or create active order
    let activeOrder = await pool.query(`
      SELECT ID_orders FROM orders 
      WHERE user_id = $1 AND ID_orders NOT IN (SELECT orders_id FROM payments) 
      ORDER BY orders_date DESC LIMIT 1
    `, [user_id]);
    let orderId;
    if (activeOrder.rows.length === 0) {
      const order = await pool.query(
        'INSERT INTO orders (user_id, orders_date, total_amount) VALUES ($1, NOW(), 0) RETURNING ID_orders',
        [user_id]
      );
      orderId = order.rows[0].id_orders;
    } else {
      orderId = activeOrder.rows[0].id_orders;
    }

    // Upsert cart item
    await pool.query(`
      INSERT INTO cart (orders_id, products_id, quantity) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (orders_id, products_id) 
      DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
    `, [orderId, product_id, quantity || 1]);

    // Update total_amount
    const items = await pool.query(`
      SELECT c.quantity, p.price FROM cart c JOIN products p ON c.products_id = p.ID_products WHERE orders_id = $1
    `, [orderId]);
    const total = items.rows.reduce((sum, item) => sum + item.quantity * item.price, 0);
    await pool.query('UPDATE orders SET total_amount = $1 WHERE ID_orders = $2', [total, orderId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error adding to cart' });
  }
});

// Delete item from cart
app.delete('/api/cart/:user_id/:product_id', async (req, res) => {
  const { user_id, product_id } = req.params;
  try {
    const activeOrder = await pool.query(`
      SELECT ID_orders FROM orders 
      WHERE user_id = $1 AND ID_orders NOT IN (SELECT orders_id FROM payments) 
      ORDER BY orders_date DESC LIMIT 1
    `, [user_id]);
    if (activeOrder.rows.length === 0) return res.status(404).json({ error: 'No active order' });

    const orderId = activeOrder.rows[0].id_orders;
    await pool.query('DELETE FROM cart WHERE orders_id = $1 AND products_id = $2', [orderId, product_id]);

    // Update total
    const items = await pool.query(`
      SELECT c.quantity, p.price FROM cart c JOIN products p ON c.products_id = p.ID_products WHERE orders_id = $1
    `, [orderId]);
    const total = items.rows.reduce((sum, item) => sum + item.quantity * item.price, 0);
    await pool.query('UPDATE orders SET total_amount = $1 WHERE ID_orders = $2', [total, orderId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting from cart' });
  }
});


// PAYMENTS CRUD
app.get('/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM payments WHERE ID_payment = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/payments', async (req, res) => {
  const { orders_id, amount } = req.body;
  try {
    const result = await pool.query('INSERT INTO payments (orders_id, amount, payment_date) VALUES ($1, $2, NOW()) RETURNING *', [orders_id, amount]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/payments/:id', async (req, res) => {
  const { id } = req.params;
  const { orders_id, amount } = req.body;
  try {
    const result = await pool.query('UPDATE payments SET orders_id = $1, amount = $2 WHERE ID_payment = $3 RETURNING *', [orders_id, amount, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM payments WHERE ID_payment = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AUTH
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.ID_role WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid password' });
    res.json({ id: user.id_users, role: user.role_name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/register', async (req, res) => {
  const { phone, password, email } = req.body;
  const hashedPass = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query('INSERT INTO users (role_id, phone, password, email) VALUES (2, $1, $2, $3) RETURNING *', [phone, hashedPass, email]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));