import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount } from '../api/discounts';
import { getUsers } from '../api/users';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // Тема

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [formProduct, setFormProduct] = useState({ discount_id: '', category_id: '', product_name: '', price: '', weight: '', picture_url: '', description: '' });
  const [formCategory, setFormCategory] = useState({ category_name: '' });
  const [formDiscount, setFormDiscount] = useState({ discount_name: '', discount_value: '', user_id: '' });
  const [editingProdId, setEditingProdId] = useState(null);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingDiscId, setEditingDiscId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDark } = useTheme(); // Тема

  useEffect(() => {
    if (user?.role !== 'admin') navigate('/');
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const prods = await getProducts();
      const cats = await getCategories();
      const discs = await getDiscounts();
      const usrs = await getUsers();
      setProducts(prods);
      setCategories(cats);
      setDiscounts(discs);
      setUsers(usrs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formProduct,
        discount_id: formProduct.discount_id ? parseInt(formProduct.discount_id) : null,
        category_id: parseInt(formProduct.category_id),
        price: parseInt(formProduct.price),
        weight: parseInt(formProduct.weight)
      };
      if (editingProdId) {
        const updated = await updateProduct(editingProdId, data);
        setProducts(prev => prev.map(p => p.id_products === editingProdId ? updated : p));
      } else {
        const newProd = await createProduct(data);
        setProducts([...products, newProd]);
      }
      setFormProduct({ discount_id: '', category_id: '', product_name: '', price: '', weight: '', picture_url: '', description: '' });
      setEditingProdId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditProduct = (prod) => {
    setFormProduct({
      discount_id: prod.discount_id || '',
      category_id: prod.category_id,
      product_name: prod.product_name,
      price: prod.price,
      weight: prod.weight,
      picture_url: prod.picture_url,
      description: prod.description
    });
    setEditingProdId(prod.id_products);
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id_products !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // Аналогично для категорий и скидок (как в лекциях)

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCatId) {
        const updated = await updateCategory(editingCatId, formCategory);
        setCategories(prev => prev.map(c => c.id_category === editingCatId ? updated : c));
      } else {
        const newCat = await createCategory(formCategory);
        setCategories([...categories, newCat]);
      }
      setFormCategory({ category_name: '' });
      setEditingCatId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditCategory = (cat) => {
    setFormCategory({ category_name: cat.category_name });
    setEditingCatId(cat.id_category);
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id_category !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formDiscount,
        discount_value: parseInt(formDiscount.discount_value),
        user_id: formDiscount.user_id ? parseInt(formDiscount.user_id) : null
      };
      if (editingDiscId) {
        const updated = await updateDiscount(editingDiscId, data);
        setDiscounts(prev => prev.map(d => d.id_discount === editingDiscId ? updated : d));
      } else {
        const newDisc = await createDiscount(data);
        setDiscounts([...discounts, newDisc]);
      }
      setFormDiscount({ discount_name: '', discount_value: '', user_id: '' });
      setEditingDiscId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditDiscount = (disc) => {
    setFormDiscount({
      discount_name: disc.discount_name,
      discount_value: disc.discount_value,
      user_id: disc.user_id || ''
    });
    setEditingDiscId(disc.id_discount);
  };

  const handleDeleteDiscount = async (id) => {
    try {
      await deleteDiscount(id);
      setDiscounts(prev => prev.filter(d => d.id_discount !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // Стили с темой
  const styles = { backgroundColor: isDark ? '#333' : '#fff', color: isDark ? '#fff' : '#000' };

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {error}</p>;

  return (
    <div className="admin-panel" style={styles}>
      <h1>Панель администратора</h1>
      <button onClick={logout}>Выход</button>

      <section>
        <h2>Товары</h2>
        <form onSubmit={handleProductSubmit}>
          <select value={formProduct.discount_id} onChange={e => setFormProduct({...formProduct, discount_id: e.target.value})}>
            <option value="">Без скидки</option>
            {discounts.map(disc => <option key={disc.id_discount} value={disc.id_discount}>{disc.discount_name} ({disc.discount_value}%)</option>)}
          </select>
          <select value={formProduct.category_id} onChange={e => setFormProduct({...formProduct, category_id: e.target.value})} required>
            {categories.map(cat => <option key={cat.id_category} value={cat.id_category}>{cat.category_name}</option>)}
          </select>
          <input value={formProduct.product_name} onChange={e => setFormProduct({...formProduct, product_name: e.target.value})} placeholder="Название" required />
          <input value={formProduct.price} onChange={e => setFormProduct({...formProduct, price: e.target.value})} placeholder="Цена" required />
          <input value={formProduct.weight} onChange={e => setFormProduct({...formProduct, weight: e.target.value})} placeholder="Вес" required />
          <input value={formProduct.picture_url} onChange={e => setFormProduct({...formProduct, picture_url: e.target.value})} placeholder="URL картинки" />
          <textarea value={formProduct.description} onChange={e => setFormProduct({...formProduct, description: e.target.value})} placeholder="Описание" />
          <button type="submit">{editingProdId ? 'Обновить' : 'Добавить'}</button>
        </form>
        <table>
          <thead><tr><th>Название</th><th>Цена</th><th>Вес</th><th>Категория</th><th>Скидка</th><th>Действия</th></tr></thead>
          <tbody>
            {products.map(prod => (
              <tr key={prod.id_products}>
                <td>{prod.product_name}</td>
                <td>{prod.price}</td>
                <td>{prod.weight}</td>
                <td>{prod.category_name}</td>
                <td>{prod.discount_value || 0}%</td>
                <td>
                  <button onClick={() => startEditProduct(prod)}>Редактировать</button>
                  <button onClick={() => handleDeleteProduct(prod.id_products)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Категории</h2>
        <form onSubmit={handleCategorySubmit}>
          <input value={formCategory.category_name} onChange={e => setFormCategory({...formCategory, category_name: e.target.value})} placeholder="Название категории" required />
          <button type="submit">{editingCatId ? 'Обновить' : 'Добавить'}</button>
        </form>
        <table>
          <thead><tr><th>Название</th><th>Действия</th></tr></thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id_category}>
                <td>{cat.category_name}</td>
                <td>
                  <button onClick={() => startEditCategory(cat)}>Редактировать</button>
                  <button onClick={() => handleDeleteCategory(cat.id_category)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Скидки</h2>
        <form onSubmit={handleDiscountSubmit}>
          <input value={formDiscount.discount_name} onChange={e => setFormDiscount({...formDiscount, discount_name: e.target.value})} placeholder="Название скидки" required />
          <input value={formDiscount.discount_value} onChange={e => setFormDiscount({...formDiscount, discount_value: e.target.value})} placeholder="Значение (%)" required />
          <select value={formDiscount.user_id} onChange={e => setFormDiscount({...formDiscount, user_id: e.target.value})}>
            <option value="">Общая (для всех)</option>
            {users.map(usr => <option key={usr.id_users} value={usr.id_users}>{usr.email}</option>)}
          </select>
          <button type="submit">{editingDiscId ? 'Обновить' : 'Добавить'}</button>
        </form>
        <table>
          <thead><tr><th>Название</th><th>Значение</th><th>Пользователь</th><th>Действия</th></tr></thead>
          <tbody>
            {discounts.map(disc => (
              <tr key={disc.id_discount}>
                <td>{disc.discount_name}</td>
                <td>{disc.discount_value}</td>
                <td>{disc.email || 'Общая'}</td>
                <td>
                  <button onClick={() => startEditDiscount(disc)}>Редактировать</button>
                  <button onClick={() => handleDeleteDiscount(disc.id_discount)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}