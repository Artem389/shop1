import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

function ProductCard({ name, price, image }) {
  const { addItem } = useCart();
  const { isDark } = useTheme();

  const handleAdd = () => {
    addItem({ name, price });
  };

  const cardStyle = {
    border: '1px solid #ccc',
    padding: '16px',
    margin: '16px',
    width: '200px',
    textAlign: 'center',
    backgroundColor: isDark ? '#444' : '#fff',
    color: isDark ? '#fff' : '#000'
  };

  return (
    <div style={cardStyle}>
      <img src={image} alt={name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
      <h3>{name}</h3>
      <p>{price} ₽</p>
      <button onClick={handleAdd}>Добавить в корзину</button>
    </div>
  );
}

export default ProductCard;