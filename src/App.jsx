// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

import ProductCard from './ProductCard';

function App() {
  return (
    <>
      <h1 style={{ textAlign: 'center' }}>Продуктовый магазин</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        <ProductCard
          name="Яблоки"
          price={99}
          image=""
        />
        <ProductCard
          name="Молоко"
          price={75}
          image="h"
        />
        <ProductCard
          name="Хлеб"
          price={45}
          image=""
        />
      </div>
    </>
  );
}

export default App;