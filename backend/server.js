const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
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

// Функция для обновления total_amount с суммированием скидок
async function updateOrderTotal(orders_id) {
  try {
    const userRes = await pool.query('SELECT user_id FROM orders WHERE ID_orders = $1', [orders_id]);
    const user_id = userRes.rows[0]?.user_id;
    if (!user_id) return;

    const personalRes = await pool.query('SELECT SUM(discount_value) as personal_sum FROM discounts WHERE user_id = $1', [user_id]);
    const personal_sum = personalRes.rows[0].personal_sum || 0;

    const totalRes = await pool.query(`
      SELECT SUM(c.quantity * p.price * (1 - (COALESCE(d.discount_value, 0) + $1) / 100.0)) AS total
      FROM cart c
      JOIN products p ON c.products_id = p.ID_products
      LEFT JOIN discounts d ON p.discount_id = d.ID_discount
      WHERE c.orders_id = $2
    `, [personal_sum, orders_id]);

    const total = Math.max(0, totalRes.rows[0].total || 0);
    await pool.query('UPDATE orders SET total_amount = $1 WHERE ID_orders = $2', [total, orders_id]);
  } catch (err) {
    console.error('Error updating order total:', err);
  }
}

// Init DB
async function initDB() {
  try {
    await pool.query(`
      INSERT INTO roles (role_name) VALUES ('user') ON CONFLICT DO NOTHING;
      INSERT INTO roles (role_name) VALUES ('admin') ON CONFLICT DO NOTHING;
    `);
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
    console.error('Error initializing DB:', err);
  }
}

initDB();

// Auth login
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

// Users register
app.post('/api/users', async (req, res) => {
  const { phone, password, email } = req.body;
  try {
    const userRole = await pool.query('SELECT ID_role FROM roles WHERE role_name = $1', ['user']);
    const hashedPass = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (role_id, phone, password, email) VALUES ($1, $2, $3, $4) RETURNING id_users',
      [userRole.rows[0].id_role, phone, hashedPass, email]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error registering: ' + err.message });
  }
});

// Get users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.ID_role');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Products CRUD
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.category_name, d.discount_name, d.discount_value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.ID_category
      LEFT JOIN discounts d ON p.discount_id = d.ID_discount
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

app.post('/api/products', async (req, res) => {
  const { discount_id, category_id, product_name, price, weight, picture_url, description } = req.body;
  try {
    const newProd = await pool.query(
      'INSERT INTO products (discount_id, category_id, product_name, price, weight, picture_url, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [discount_id || null, category_id || null, product_name, price, weight, picture_url, description]
    );
    res.json(newProd.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating product: ' + err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { discount_id, category_id, product_name, price, weight, picture_url, description } = req.body;
  try {
    const updated = await pool.query(
      'UPDATE products SET discount_id = $1, category_id = $2, product_name = $3, price = $4, weight = $5, picture_url = $6, description = $7 WHERE ID_products = $8 RETURNING *',
      [discount_id || null, category_id || null, product_name, price, weight, picture_url, description, id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error updating product: ' + err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Сначала удаляем связанные записи в cart
    await pool.query('DELETE FROM cart WHERE products_id = $1', [id]);
    await pool.query('DELETE FROM products WHERE ID_products = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting product: ' + err.message });
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
    const newCat = await pool.query('INSERT INTO categories (category_name) VALUES ($1) RETURNING *', [category_name]);
    res.json(newCat.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating category' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { category_name } = req.body;
  try {
    const updated = await pool.query('UPDATE categories SET category_name = $1 WHERE ID_category = $2 RETURNING *', [category_name, id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error updating category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Сначала разрываем ссылки в products
    await pool.query('UPDATE products SET category_id = NULL WHERE category_id = $1', [id]);
    await pool.query('DELETE FROM categories WHERE ID_category = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting category: ' + err.message });
  }
});

// Discounts CRUD
app.get('/api/discounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT d.*, u.email FROM discounts d LEFT JOIN users u ON d.user_id = u.id_users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching discounts' });
  }
});

app.post('/api/discounts', async (req, res) => {
  const { discount_name, discount_value, user_id } = req.body;
  try {
    const newDisc = await pool.query(
      'INSERT INTO discounts (discount_name, discount_value, user_id) VALUES ($1, $2, $3) RETURNING *',
      [discount_name, discount_value, user_id || null]
    );
    res.json(newDisc.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating discount' });
  }
});

app.put('/api/discounts/:id', async (req, res) => {
  const { id } = req.params;
  const { discount_name, discount_value, user_id } = req.body;
  try {
    const updated = await pool.query(
      'UPDATE discounts SET discount_name = $1, discount_value = $2, user_id = $3 WHERE ID_discount = $4 RETURNING *',
      [discount_name, discount_value, user_id || null, id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error updating discount' });
  }
});

app.delete('/api/discounts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Сначала разрываем ссылки в products
    await pool.query('UPDATE products SET discount_id = NULL WHERE discount_id = $1', [id]);
    await pool.query('DELETE FROM discounts WHERE ID_discount = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting discount: ' + err.message });
  }
});

// Get user personal discount sum
app.get('/api/discounts/user/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query('SELECT SUM(discount_value) as personal_sum FROM discounts WHERE user_id = $1', [user_id]);
    res.json({ personal_sum: result.rows[0].personal_sum || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user discount' });
  }
});

// Orders
app.post('/api/orders', async (req, res) => {
  const { user_id, items } = req.body;
  try {
    const orderRes = await pool.query(
      'INSERT INTO orders (user_id, orders_date, total_amount) VALUES ($1, NOW(), 0) RETURNING ID_orders',
      [user_id]
    );
    const orders_id = orderRes.rows[0].id_orders;

    for (const item of items) {
      await pool.query(
        'INSERT INTO cart (orders_id, products_id, quantity) VALUES ($1, $2, $3)',
        [orders_id, item.product_id, item.quantity || 1]
      );
    }
    await updateOrderTotal(orders_id);
    res.json({ id_orders: orders_id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating order: ' + err.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { address, payment_type } = req.body;
  try {
    const order = await pool.query(
      'UPDATE orders SET address = $1, payment_type = $2 WHERE ID_orders = $3 RETURNING *',
      [address, payment_type, id]
    );
    await pool.query(
      'INSERT INTO payments (orders_id, amount, payment_date) VALUES ($1, $2, NOW())',
      [id, order.rows[0].total_amount]
    );
    res.json(order.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error updating order: ' + err.message });
  }
});

app.get('/api/orders/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT o.*, c.ID_cart as cart_id, c.quantity, p.ID_products as product_id, p.product_name, p.price, d.discount_value, py.payment_date
      FROM orders o 
      JOIN cart c ON o.ID_orders = c.orders_id 
      JOIN products p ON c.products_id = p.ID_products
      LEFT JOIN discounts d ON p.discount_id = d.ID_discount
      LEFT JOIN payments py ON o.ID_orders = py.orders_id
      WHERE o.user_id = $1
    `, [user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Cart operations with checks
app.post('/api/cart', async (req, res) => {
  const { orders_id, products_id, quantity } = req.body;
  try {
    // Check if order completed
    const paymentCheck = await pool.query('SELECT * FROM payments WHERE orders_id = $1', [orders_id]);
    if (paymentCheck.rows.length > 0) {
      return res.status(403).json({ error: 'Cannot modify completed order' });
    }

    const existing = await pool.query('SELECT * FROM cart WHERE orders_id = $1 AND products_id = $2', [orders_id, products_id]);
    let newCart;
    if (existing.rows.length > 0) {
      newCart = await pool.query(
        'UPDATE cart SET quantity = quantity + $1 WHERE ID_cart = $2 RETURNING *',
        [quantity, existing.rows[0].id_cart]
      );
    } else {
      newCart = await pool.query(
        'INSERT INTO cart (orders_id, products_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [orders_id, products_id, quantity]
      );
    }
    await updateOrderTotal(orders_id);
    res.json(newCart.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error adding to cart: ' + err.message });
  }
});

app.delete('/api/cart/:cart_id', async (req, res) => {
  const { cart_id } = req.params;
  try {
    const orderRes = await pool.query('SELECT orders_id FROM cart WHERE ID_cart = $1', [cart_id]);
    const orders_id = orderRes.rows[0]?.orders_id;
    if (!orders_id) return res.status(404).json({ error: 'Cart item not found' });

    const paymentCheck = await pool.query('SELECT * FROM payments WHERE orders_id = $1', [orders_id]);
    if (paymentCheck.rows.length > 0) {
      return res.status(403).json({ error: 'Cannot modify completed order' });
    }

    await pool.query('DELETE FROM cart WHERE ID_cart = $1', [cart_id]);
    await updateOrderTotal(orders_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting cart item' });
  }
});

app.put('/api/cart/:cart_id', async (req, res) => {
  const { cart_id } = req.params;
  const { quantity } = req.body;
  try {
    const orderRes = await pool.query('SELECT orders_id FROM cart WHERE ID_cart = $1', [cart_id]);
    const orders_id = orderRes.rows[0]?.orders_id;
    if (!orders_id) return res.status(404).json({ error: 'Cart item not found' });

    const paymentCheck = await pool.query('SELECT * FROM payments WHERE orders_id = $1', [orders_id]);
    if (paymentCheck.rows.length > 0) {
      return res.status(403).json({ error: 'Cannot modify completed order' });
    }

    await pool.query('UPDATE cart SET quantity = $1 WHERE ID_cart = $2', [quantity, cart_id]);
    await updateOrderTotal(orders_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error updating cart' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});