const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Для хэширования паролей
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT,
});

// Создать роли и админа по умолчанию
async function initDB() {
  try {
    // Создать роли если нет
    await pool.query(`
      INSERT INTO roles (role_name) VALUES ('user') ON CONFLICT DO NOTHING;
      INSERT INTO roles (role_name) VALUES ('admin') ON CONFLICT DO NOTHING;
    `);
    // Создать админа если нет
    const adminRole = await pool.query('SELECT ID_role FROM roles WHERE role_name = $1', ['admin']);
    const adminExists = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
    if (adminExists.rows.length === 0) {
      const hashedPass = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (role_id, phone, password, email) VALUES ($1, $2, $3, $4)',
        [adminRole.rows[0].id_role, '12345678901', hashedPass, 'admin@example.com']
      );
      console.log('Admin created');
    }
  } catch (err) {
    console.error('Init DB error:', err);
  }
}

initDB();

// Auth: login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users u JOIN roles r ON u.role_id = r.ID_role WHERE email = $1', [email]);
    if (user.rows.length === 0 || !await bcrypt.compare(password, user.rows[0].password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ user: { id: user.rows[0].id_users, role: user.rows[0].role_name } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Users: register (для user)
app.post('/api/users', async (req, res) => {
  const { phone, password, email } = req.body;
  try {
    const userRole = await pool.query('SELECT ID_role FROM roles WHERE role_name = $1', ['user']);
    const hashedPass = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (role_id, phone, password, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [userRole.rows[0].id_role, phone, hashedPass, email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Products CRUD
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.category_name, d.discount_value 
      FROM products p 
      JOIN categories c ON p.category_id = c.ID_category 
      JOIN discounts d ON p.discount_id = d.ID_discount
    `);
    // Рандомно назначить скидку 30% товаров (если discount_value=0)
    result.rows.forEach(row => {
      if (row.discount_value === 0 && Math.random() < 0.3) row.discount_value = 10; // Пример скидки
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

app.post('/api/products', async (req, res) => {
  const { discount_id, category_id, product_name, price, weight, picture_url, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (discount_id, category_id, product_name, price, weight, picture_url, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [discount_id, category_id, product_name, price, weight, picture_url, description]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { discount_id, category_id, product_name, price, weight, picture_url, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET discount_id=$1, category_id=$2, product_name=$3, price=$4, weight=$5, picture_url=$6, description=$7 WHERE ID_products=$8 RETURNING *',
      [discount_id, category_id, product_name, price, weight, picture_url, description, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error updating product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE ID_products=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// Categories CRUD
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { category_name } = req.body;
  try {
    const result = await pool.query('INSERT INTO categories (category_name) VALUES ($1) RETURNING *', [category_name]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating category' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { category_name } = req.body;
  try {
    const result = await pool.query('UPDATE categories SET category_name=$1 WHERE ID_category=$2 RETURNING *', [category_name, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error updating category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM categories WHERE ID_category=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting category' });
  }
});

// Discounts CRUD (админ назначает на user или товар)
app.get('/api/discounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM discounts');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching discounts' });
  }
});

app.post('/api/discounts', async (req, res) => {
  const { discount_name, discount_value, user_id } = req.body;
  try {
    const result = await pool.query('INSERT INTO discounts (discount_name, discount_value, user_id) VALUES ($1, $2, $3) RETURNING *', [discount_name, discount_value, user_id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating discount' });
  }
});

app.put('/api/discounts/:id', async (req, res) => {
  const { id } = req.params;
  const { discount_name, discount_value, user_id } = req.body;
  try {
    const result = await pool.query('UPDATE discounts SET discount_name=$1, discount_value=$2, user_id=$3 WHERE ID_discount=$4 RETURNING *', [discount_name, discount_value, user_id, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error updating discount' });
  }
});

app.delete('/api/discounts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM discounts WHERE ID_discount=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting discount' });
  }
});

// Orders/Cart (для корзины пользователя)
app.post('/api/orders', async (req, res) => {
  const { user_id, items } = req.body; // items: [{product_id, quantity}]
  try {
    const order = await pool.query(
      'INSERT INTO orders (user_id, orders_date, total_amount) VALUES ($1, NOW(), 0) RETURNING *',
      [user_id]
    );
    let total = 0;
    for (const item of items) {
      await pool.query('INSERT INTO cart (orders_id, products_id, quantity) VALUES ($1, $2, $3)', [order.rows[0].id_orders, item.product_id, item.quantity]);
      const prod = await pool.query('SELECT price FROM products WHERE ID_products=$1', [item.product_id]);
      total += prod.rows[0].price * item.quantity;
    }
    await pool.query('UPDATE orders SET total_amount=$1 WHERE ID_orders=$2', [total, order.rows[0].id_orders]);
    res.json(order.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating order' });
  }
});

app.get('/api/orders/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT o.*, c.ID_cart as cart_id, c.quantity, p.ID_products as product_id, p.product_name, p.price, d.discount_value
      FROM orders o 
      JOIN cart c ON o.ID_orders = c.orders_id 
      JOIN products p ON c.products_id = p.ID_products
      JOIN discounts d ON p.discount_id = d.ID_discount
      WHERE o.user_id = $1
    `, [user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Новый endpoint для удаления из корзины
app.delete('/api/cart/:cart_id', async (req, res) => {
  const { cart_id } = req.params;
  try {
    await pool.query('DELETE FROM cart WHERE ID_cart = $1', [cart_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting cart item' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});