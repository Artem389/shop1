require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Подключение к БД
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Проверка подключения
pool.connect(async (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err.stack);
  } else {
    console.log('Подключено к БД');

    // --- СОЗДАНИЕ АДМИНА ПО УМОЛЧАНИЮ ---
    try {
      // Проверяем, есть ли роль "admin"
      const roleResult = await pool.query('SELECT * FROM roles WHERE role_name = $1', ['admin']);
      let adminRoleId;

      if (roleResult.rows.length === 0) {
        const insertRole = await pool.query(
          'INSERT INTO roles (role_name) VALUES ($1) RETURNING id_role',
          ['admin']
        );
        adminRoleId = insertRole.rows[0].id_role;
        console.log('Создана роль: admin');
      } else {
        adminRoleId = roleResult.rows[0].id_role;
      }

      // Проверяем, есть ли админ-пользователь
      const adminResult = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
      if (adminResult.rows.length === 0) {
        await pool.query(
          'INSERT INTO users (role_id, phone, password, email) VALUES ($1, $2, $3, $4)',
          [adminRoleId, '00000000000', 'admin', 'admin@example.com']
        );
        console.log('Создан админ: admin@example.com / admin');
      } else {
        console.log('Админ уже существует');
      }
    } catch (createErr) {
      console.error('Ошибка при создании админа:', createErr.message);
    }
    // --- КОНЕЦ БЛОКА АДМИНА ---
  }
});

// Эндпоинты для roles (CRUD)
app.get('/roles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/roles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM roles WHERE id_role = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Роль не найдена' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/roles', async (req, res) => {
  const { role_name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO roles (role_name) VALUES ($1) RETURNING *',
      [role_name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/roles/:id', async (req, res) => {
  const { id } = req.params;
  const { role_name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE roles SET role_name = $1 WHERE id_role = $2 RETURNING *',
      [role_name, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Роль не найдена' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/roles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM roles WHERE id_role = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Роль удалена' });
    } else {
      res.status(404).json({ error: 'Роль не найдена' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Эндпоинты для users (CRUD + login)
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (result.rows.length > 0) {
      res.json({ user: result.rows[0], message: 'Авторизация успешна' });
    } else {
      res.status(401).json({ error: 'Неверный email или пароль' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE id_users = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Пользователь не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', async (req, res) => {
  const { role_id, phone, password, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (role_id, phone, password, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [role_id, phone, password, email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role_id, phone, password, email } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET role_id = $1, phone = $2, password = $3, email = $4 WHERE id_users = $5 RETURNING *',
      [role_id, phone, password, email, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Пользователь не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE id_users = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Пользователь удален' });
    } else {
      res.status(404).json({ error: 'Пользователь не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Эндпоинты для categories (CRUD)
app.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM categories WHERE id_category = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Категория не найдена' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/categories', async (req, res) => {
  const { category_name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (category_name) VALUES ($1) RETURNING *',
      [category_name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { category_name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE categories SET category_name = $1 WHERE id_category = $2 RETURNING *',
      [category_name, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Категория не найдена' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM categories WHERE id_category = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Категория удалена' });
    } else {
      res.status(404).json({ error: 'Категория не найдена' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Эндпоинты для discounts (CRUD + assign)
app.get('/discounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM discounts');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/discounts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM discounts WHERE id_discount = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Скидка не найдена' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/discounts', async (req, res) => {
  const { discount_name, discount_value, user_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO discounts (discount_name, discount_value, user_id) VALUES ($1, $2, $3) RETURNING *',
      [discount_name, discount_value, user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/discounts/:id', async (req, res) => {
  const { id } = req.params;
  const { discount_name, discount_value, user_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE discounts SET discount_name = $1, discount_value = $2, user_id = $3 WHERE id_discount = $4 RETURNING *',
      [discount_name, discount_value, user_id, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Скидка не найдена' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/discounts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM discounts WHERE id_discount = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Скидка удалена' });
    } else {
      res.status(404).json({ error: 'Скидка не найдена' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/assign-discount', async (req, res) => {
  const { discount_id, user_id, product_id } = req.body;
  try {
    if (user_id) {
      await pool.query('UPDATE discounts SET user_id = $1 WHERE id_discount = $2', [user_id, discount_id]);
    }
    if (product_id) {
      await pool.query('UPDATE products SET discount_id = $1 WHERE id_products = $2', [discount_id, product_id]);
    }
    res.json({ message: 'Скидка назначена' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Эндпоинты для products (CRUD, с фильтром по category_id и симуляцией скидок)
app.get('/products', async (req, res) => {
  const { category_id } = req.query;
  let query = 'SELECT p.*, d.discount_value FROM products p LEFT JOIN discounts d ON p.discount_id = d.id_discount';
  const values = [];
  if (category_id) {
    query += ' WHERE p.category_id = $1';
    values.push(category_id);
  }
  try {
    const result = await pool.query(query, values);
    // Симуляция 30% со скидкой (для демо)
    const products = result.rows.map((p, index) => {
      if (index % 3 === 0 && !p.discount_value) {
        p.discount_value = 10;
      }
      return p;
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT p.*, d.discount_value FROM products p LEFT JOIN discounts d ON p.discount_id = d.id_discount WHERE p.id_products = $1',
      [id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Продукт не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', async (req, res) => {
  const { discount_id, category_id, product_name, price, weight, picture_url } = req.body; // Добавь description, duration если расширил БД
  try {
    const result = await pool.query(
      'INSERT INTO products (discount_id, category_id, product_name, price, weight, picture_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [discount_id, category_id, product_name, price, weight, picture_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { discount_id, category_id, product_name, price, weight, picture_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET discount_id = $1, category_id = $2, product_name = $3, price = $4, weight = $5, picture_url = $6 WHERE id_products = $7 RETURNING *',
      [discount_id, category_id, product_name, price, weight, picture_url, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Продукт не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id_products = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Продукт удален' });
    } else {
      res.status(404).json({ error: 'Продукт не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Эндпоинты для orders (CRUD)
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id_orders = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Заказ не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/orders', async (req, res) => {
  const { user_id, total_amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO orders (user_id, orders_date, total_amount) VALUES ($1, NOW(), $2) RETURNING *',
      [user_id, total_amount]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id, total_amount } = req.body;
  try {
    const result = await pool.query(
      'UPDATE orders SET user_id = $1, total_amount = $2 WHERE id_orders = $3 RETURNING *',
      [user_id, total_amount, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Заказ не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM orders WHERE id_orders = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Заказ удален' });
    } else {
      res.status(404).json({ error: 'Заказ не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Эндпоинты для cart (CRUD)
app.get('/cart', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cart');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/cart/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM cart WHERE id_cart = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Элемент корзины не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/cart/by-order/:order_id', async (req, res) => {
  const { order_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM cart WHERE orders_id = $1', [order_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/cart', async (req, res) => {
  const { orders_id, products_id, quantity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO cart (orders_id, products_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [orders_id, products_id, quantity]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/cart/:id', async (req, res) => {
  const { id } = req.params;
  const { orders_id, products_id, quantity } = req.body;
  try {
    const result = await pool.query(
      'UPDATE cart SET orders_id = $1, products_id = $2, quantity = $3 WHERE id_cart = $4 RETURNING *',
      [orders_id, products_id, quantity, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Элемент корзины не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/cart/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM cart WHERE id_cart = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Элемент корзины удален' });
    } else {
      res.status(404).json({ error: 'Элемент корзины не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Эндпоинты для payments (CRUD)
app.get('/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM payments WHERE id_payment = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Платеж не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/payments', async (req, res) => {
  const { orders_id, amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO payments (orders_id, amount, payment_date) VALUES ($1, $2, NOW()) RETURNING *',
      [orders_id, amount]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/payments/:id', async (req, res) => {
  const { id } = req.params;
  const { orders_id, amount } = req.body;
  try {
    const result = await pool.query(
      'UPDATE payments SET orders_id = $1, amount = $2 WHERE id_payment = $3 RETURNING *',
      [orders_id, amount, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Платеж не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/payments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM payments WHERE id_payment = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Платеж удален' });
    } else {
      res.status(404).json({ error: 'Платеж не найден' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});