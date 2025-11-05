import ProductCard from '../components/ProductCard';

const products = [
  { name: "Яблоки", price: 99, image: "https://png.pngtree.com/png-vector/20250127/ourmid/pngtree-apple-on-white-background-for-clean-and-minimal-design-png-image_15351068.png" },
  { name: "Молоко", price: 75, image: "https://udoba.org/sites/default/files/h5p/content/50758/images/file-6358c44c5f8b7.png" },
  { name: "Хлеб", price: 45, image: "https://www.pngmart.com/files/22/Wheat-bread-PNG-Free-Download.png" },
  { name: "Сыр", price: 200, image: "https://iili.io/H8Ehebp.png" },
  { name: "Кофе", price: 350, image: "https://www.pngall.com/wp-content/uploads/13/Nescafe-PNG-Cutout.png" }
];

function Home() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ textAlign: 'center' }}>Каталог товаров</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {products.map(product => (
          <ProductCard key={product.name} {...product} />
        ))}
      </div>
    </div>
  );
}

export default Home;