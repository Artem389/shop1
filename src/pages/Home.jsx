import { useState, useEffect } from 'react';
import { getProducts } from '../api/products';
import { getCategories } from '../api/categories';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem } = useCart();
  const { user, personalDiscount } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    console.log('Начинаю загрузку продуктов и категорий...');
    async function fetchData() {
      try {
        const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
        setProducts(prods);
        setCategories(cats);
        console.log('Продукты и категории загружены успешно');
      } catch (err) {
        setError(err.message);
        console.error('Ошибка загрузки каталога:', err.message);
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

  if (loading) return <div className="loading">Загрузка каталога...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;

  return (
    <div className="home">
      <h1><center>Каталог товаров</center></h1>
      <div className="content-row">
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
          {filteredProducts.length === 0 ? (
            <p>Товары не найдены</p>
          ) : (
            filteredProducts.map(prod => {
              const productDisc = Number(prod.discount_value || 0);
              const totalDisc = user ? productDisc + personalDiscount : productDisc;
              const discountedPrice = Math.floor(Math.max(0, prod.price * (1 - totalDisc / 100)));
              return (
                <div key={prod.id_products} className="product-card">
                  <img src={prod.picture_url || '/no-image.jpg'} alt={prod.product_name} />
                  <h2>{prod.product_name}</h2>
                  <p>{prod.description}</p>
                  <p className="price">Цена: {discountedPrice} ₽ {totalDisc > 0 && `(скидка ${totalDisc}%)`}</p>
                  <p>Вес: {prod.weight} г</p>
                  <button onClick={() => addItem({ id: prod.id_products, ...prod })}>
                    Добавить в корзину
                  </button>
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}