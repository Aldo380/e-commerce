import { useNavigate } from '@tanstack/react-router';
import { useGetProducts } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCartStore } from '../lib/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function CartPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: products } = useGetProducts();
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();

  if (!identity) {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please login to view your cart</p>
            <Button onClick={() => navigate({ to: '/' })}>Go to Products</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cartProducts = items
    .map((item) => {
      const product = products?.find((p) => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter(Boolean);

  const totalAmount = cartProducts.reduce((sum, item) => {
    if (!item) return sum;
    return sum + Number(item.price) * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (cartProducts.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate({ to: '/checkout' });
  };

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

      {cartProducts.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => navigate({ to: '/' })}>Continue Shopping</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartProducts.map((item) => {
              if (!item) return null;
              const priceInDollars = Number(item.price) / 100;
              const subtotal = priceInDollars * item.quantity;

              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.image.getDirectURL()}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        <p className="text-lg font-bold mt-2">${priceInDollars.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            removeItem(item.id);
                            toast.success('Item removed from cart');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-semibold">${subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">${(totalAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold">Free</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${(totalAmount / 100).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button onClick={handleCheckout} className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: '/' })}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
