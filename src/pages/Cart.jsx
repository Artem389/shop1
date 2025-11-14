import { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // Интеграция темы

export default function Cart() {
  const { items, loading, error, loadCart, removeItem, updateQuantity } = useCart();
  const { user, personalDiscount } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme(); // Тема

  useEffect(() => {
    if (user) loadCart();
  }, [user]);

  if (!user) return <div className="error">Авторизуйтесь для просмотра корзины</div>;
  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;

  const total = Math.floor(items.reduce((sum, item) => {
    const productDisc = Number(item.discount_value || 0); // Преобразование в число
    const totalDisc = productDisc + personalDiscount;
    const discountedPrice = Math.floor(Math.max(0, item.price * (1 - totalDisc / 100))); // Округление
    return sum + discountedPrice * item.quantity;
  }, 0));

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="cart">
      <h1>Корзина</h1>
      {items.map(item => {
        const productDisc = Number(item.discount_value || 0); // Преобразование
        const totalDisc = productDisc + personalDiscount;
        const discountedPrice = Math.floor(Math.max(0, item.price * (1 - totalDisc / 100))); // Округление
        return (
          <div key={item.cart_id}>
            <h2>{item.product_name}</h2>
            <p>Количество: {item.quantity}</p>
            <button onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}>-</button>
            <button onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}>+</button>
            <p>Сумма: {discountedPrice * item.quantity} руб. (Скидка: {totalDisc}%)</p>
            <button onClick={() => removeItem(item.cart_id)}>Удалить полностью</button>
          </div>
        );
      })}
      <p>Итого: {total} руб.</p>
      <button onClick={handleCheckout}>Оформить заказ</button>
    </div>
  );
}