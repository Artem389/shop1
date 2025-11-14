import { useState, useEffect } from 'react';
import { getProducts } from '../api/products';
import { getCategories } from '../api/categories';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // Тема

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem } = useCart();
  const { user, personalDiscount } = useAuth();
  const { isDark } = useTheme(); // Тема

  useEffect(() => {
    async function fetchData() {
      try {
        const prods = await getProducts();
        const cats = await getCategories();
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCategoryChange = (catId) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const filteredProducts = products.filter(prod => 
    selectedCategories.length === 0 || selectedCategories.includes(prod.category_id)
  );

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {error}</p>;

  // Стили с темой
  const styles = { backgroundColor: isDark ? '#333' : '#fff', color: isDark ? '#fff' : '#000' };

  return (
    <div className="home" style={styles}>
      <aside className="categories-filter">
        <h3>Категории</h3>
        {categories.map(cat => (
          <label key={cat.id_category}>
            <input 
              type="checkbox" 
              checked={selectedCategories.includes(cat.id_category)}
              onChange={() => handleCategoryChange(cat.id_category)}
            />
            {cat.category_name}
          </label>
        ))}
      </aside>
      <main>
        <h1>Каталог товаров</h1>
        {filteredProducts.map(prod => {
          const productDisc = Number(prod.discount_value || 0); // Преобразование
          const totalDisc = user ? productDisc + personalDiscount : productDisc;
          const discountedPrice = Math.max(0, prod.price * (1 - totalDisc / 100));
          return (
            <div key={prod.id_products} className="product-card">
              <img src={prod.picture_url} alt={prod.product_name} />
              <h2>{prod.product_name}</h2>
              <p>{prod.description}</p>
              <p>Цена: {discountedPrice} руб. (Скидка: {totalDisc}%)</p>
              <p>Вес: {prod.weight} г</p>
              <button onClick={() => addItem({ id: prod.id_products, ...prod })}>
                Добавить в корзину
              </button>
            </div>
          );
        })}
      </main>
    </div>
  );
}