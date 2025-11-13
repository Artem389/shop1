import { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, loading, error, loadCart, removeItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadCart();
  }, [user]);

  if (!user) return <p>Авторизуйтесь для просмотра корзины</p>;
  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {error}</p>;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart">
      <h1>Корзина</h1>
      {items.map(item => (
        <div key={`${item.id_orders}_${item.product_id}`}>
          <h2>{item.product_name}</h2>
          <p>Количество: {item.quantity}</p>
          <p>Сумма: {item.price * item.quantity} руб.</p>
          <button onClick={() => removeItem(item.product_id)}>Удалить</button>
        </div>
      ))}
      <p>Итого: {total} руб.</p>
    </div>
  );
}