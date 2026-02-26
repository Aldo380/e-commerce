import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetProduct } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCartStore } from '../lib/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ProductDetailPage() {
  const { productId } = useParams({ from: '/product/$productId' });
  const { data: product, isLoading } = useGetProduct(productId);
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!identity) {
      toast.error('Please login to add items to cart');
      return;
    }
    if (!product) return;
    addItem(product.id, quantity);
    toast.success(`${quantity} × ${product.name} added to cart`);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-32 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate({ to: '/' })} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Product not found</p>
        </div>
      </div>
    );
  }

  const priceInDollars = Number(product.price) / 100;

  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={() => navigate({ to: '/' })} className="mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
          <img src={product.image.getDirectURL()} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
            <p className="text-3xl font-bold text-primary">${priceInDollars.toFixed(2)}</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground">{product.description}</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="font-semibold">Quantity:</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <Button onClick={handleAddToCart} size="lg" className="w-full gap-2">
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
