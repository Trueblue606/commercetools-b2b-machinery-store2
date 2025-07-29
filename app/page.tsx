import { getProducts } from '@/lib/getProducts';

export default async function Home() {
  const products = await getProducts();

  return (
    <main style={{ padding: 32 }}>
      <h1>Product List</h1>
      <ul>
        {products.map((product: any) => (
          <li key={product.id}>
            <strong>{product.masterData.current.name?.en ?? 'Unnamed Product'}</strong>
          </li>
        ))}
      </ul>
    </main>
  );
}
