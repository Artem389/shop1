import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

function Cart() {
  const { cart, removeOneItem, removeItem, getTotalPrice } = useCart();
  const { isDark } = useTheme();

  const cartStyle = {
    padding: '2rem',
    backgroundColor: isDark ? '#333' : '#fff',
    color: isDark ? '#fff' : '#000',
    maxWidth: '800px',
    margin: '0 auto'
  };

  const itemStyle = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '1rem',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: `1px solid ${isDark ? '#555' : '#eee'}`
  };

  const headerStyle = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '1rem',
    fontWeight: 'bold',
    padding: '1rem 0',
    borderBottom: `2px solid ${isDark ? '#777' : '#ccc'}`
  };

  return (
    <div style={cartStyle}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Корзина</h1>
      {cart.items.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Корзина пуста</p>
      ) : (
        <>
          <div style={headerStyle}>
            <span>Товар</span>
            <span>Цена</span>
            <span>Количество</span>
            <span>Действия</span>
          </div>
          {cart.items.map(item => (
            <div key={item.name} style={itemStyle}>
              <span style={{ fontWeight: 'bold' }}>{item.name}</span>
              <span>{item.price} ₽</span>
              <span>{item.quantity} шт.</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => removeOneItem(item)}
                  style={{ 
                    padding: '0.25rem 0.5rem', 
                    fontSize: '0.8rem',
                    backgroundColor: '#ff6b6b',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  -1
                </button>
                <button 
                  onClick={() => removeItem(item)}
                  style={{ 
                    padding: '0.25rem 0.5rem', 
                    fontSize: '0.8rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
          <div style={{ 
            marginTop: '2rem', 
            paddingTop: '1rem', 
            borderTop: `2px solid ${isDark ? '#777' : '#ccc'}`,
            textAlign: 'right',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}>
            Итого: {getTotalPrice()} ₽
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;