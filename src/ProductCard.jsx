import { useState } from 'react';

function ProductCard({ name, price, image }) {
  const [count, setCount] = useState(0);

  const handleAdd = () => {
    setCount(count + 1);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', margin: '16px', width: '200px', textAlign: 'center' }}>
      <img src={image} alt={name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
      <h3>{name}</h3>
      <p>{price} ₽</p>
      <button onClick={handleAdd}>Добавить в корзину</button>
      <p>В корзине: {count}</p>
    </div>
  );
}

export default ProductCard;