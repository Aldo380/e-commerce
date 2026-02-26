import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import type { ProductDetails } from '../backend';

interface ProductCardProps {
  product: ProductDetails;
  onAddToCart?: (product: ProductDetails) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate({ to: '/product/$productId', params: { productId: product.id } });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const priceInDollars = Number(product.price) / 100;

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={handleCardClick}>
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={product.image.getDirectURL()}
          alt={product.name}
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
        <p className="text-xl font-bold mt-2">${priceInDollars.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAddToCart} className="w-full gap-2">
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
