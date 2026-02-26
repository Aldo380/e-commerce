import { useGetProducts } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCartStore } from '../lib/cartStore';
import ProductCard from '../components/ProductCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { ProductDetails } from '../backend';

export default function ProductListingPage() {
  const { data: products, isLoading } = useGetProducts();
  const { identity } = useInternetIdentity();
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (product: ProductDetails) => {
    if (!identity) {
      toast.error('Please login to add items to cart');
      return;
    }
    addItem(product.id, 1);
    toast.success(`${product.name} added to cart`);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-4" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className="relative h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: 'url(/assets/generated/hero-banner.dim_1200x400.png)' }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Welcome to Shop ICP</h1>
          <p className="text-xl mb-6">Discover amazing products on the Internet Computer</p>
          <Button size="lg" variant="secondary">
            Shop Now
          </Button>
        </div>
      </div>

      <div className="container py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Our Products</h2>
          <p className="text-muted-foreground">Browse our collection of quality items</p>
        </div>

        {!products || products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
