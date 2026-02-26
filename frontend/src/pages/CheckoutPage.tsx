import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetProducts, useCreateOrder, useCreateCheckoutSession, useProcessCoinbasePayment } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCartStore } from '../lib/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PaymentMethod } from '../backend';

export default function CheckoutPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: products } = useGetProducts();
  const { items, clearCart } = useCartStore();
  const createOrder = useCreateOrder();
  const createCheckoutSession = useCreateCheckoutSession();
  const processCoinbasePayment = useProcessCoinbasePayment();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'coinbaseICP'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!identity) {
    navigate({ to: '/' });
    return null;
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

  const handlePayment = async () => {
    if (cartProducts.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      const cartId = identity.getPrincipal().toString();
      const method: PaymentMethod = paymentMethod === 'stripe' ? PaymentMethod.stripe : PaymentMethod.coinbaseICP;
      
      const order = await createOrder.mutateAsync({ cartId, paymentMethod: method });

      if (!order) {
        throw new Error('Failed to create order');
      }

      if (paymentMethod === 'stripe') {
        const shoppingItems = cartProducts.map((item) => ({
          productName: item!.name,
          productDescription: item!.description,
          priceInCents: item!.price,
          quantity: BigInt(item!.quantity),
          currency: 'usd',
        }));

        const session = await createCheckoutSession.mutateAsync(shoppingItems);
        clearCart();
        window.location.href = session.url;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        const result = await processCoinbasePayment.mutateAsync(order.id);
        
        if (result.success) {
          clearCart();
          toast.success('Payment successful!');
          navigate({ to: '/payment-success' });
        } else {
          toast.error(result.message);
          navigate({ to: '/payment-failure' });
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="flex-1 cursor-pointer flex items-center gap-3">
                    <img src="/assets/generated/stripe-logo-transparent.dim_200x100.png" alt="Stripe" className="h-8" />
                    <div>
                      <p className="font-semibold">Credit/Debit Card</p>
                      <p className="text-sm text-muted-foreground">Pay securely with Stripe</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="coinbaseICP" id="coinbaseICP" />
                  <Label htmlFor="coinbaseICP" className="flex-1 cursor-pointer flex items-center gap-3">
                    <img src="/assets/generated/icp-logo-transparent.dim_100x100.png" alt="ICP" className="h-8" />
                    <div>
                      <p className="font-semibold">ICP Crypto Payment</p>
                      <p className="text-sm text-muted-foreground">Pay with Internet Computer tokens (Simulated)</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cartProducts.map((item) => {
                  if (!item) return null;
                  const priceInDollars = Number(item.price) / 100;
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} × {item.quantity}
                      </span>
                      <span>${(priceInDollars * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${(totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={handlePayment} className="w-full" size="lg" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Complete Payment'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
