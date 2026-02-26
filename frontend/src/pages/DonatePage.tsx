import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useDonate, useCreateCheckoutSession } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';
import { PaymentMethod } from '../backend';

export default function DonatePage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const donate = useDonate();
  const createCheckoutSession = useCreateCheckoutSession();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'coinbaseICP'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDonate = async () => {
    if (!identity) {
      toast.error('Please login to make a donation');
      return;
    }

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount < 1) {
      toast.error('Please enter a valid donation amount (minimum $1)');
      return;
    }

    if (donationAmount > 100000) {
      toast.error('Maximum donation amount is $100,000');
      return;
    }

    setIsProcessing(true);

    try {
      const method: PaymentMethod = paymentMethod === 'stripe' ? PaymentMethod.stripe : PaymentMethod.coinbaseICP;
      const amountInCents = BigInt(Math.round(donationAmount * 100));

      const donationRecord = await donate.mutateAsync({
        amount: amountInCents,
        currency: 'usd',
        message: message.trim(),
        paymentMethod: method,
      });

      if (paymentMethod === 'stripe') {
        const shoppingItems = [
          {
            productName: 'Donation',
            productDescription: message.trim() || 'Thank you for your generous donation!',
            priceInCents: amountInCents,
            quantity: BigInt(1),
            currency: 'usd',
          },
        ];

        const session = await createCheckoutSession.mutateAsync(shoppingItems);
        if (!session?.url) {
          throw new Error('Stripe session missing url');
        }
        window.location.href = session.url;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast.success('Donation successful! Thank you for your support!');
        setAmount('');
        setMessage('');
        navigate({ to: '/orders' });
      }
    } catch (error: any) {
      console.error('Donation error:', error);
      toast.error(error.message || 'Failed to process donation');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <Heart className="h-8 w-8 fill-destructive text-destructive" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Support Our Mission</h1>
          <p className="text-muted-foreground">
            Your generous donation helps us continue providing quality products and services
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Make a Donation</CardTitle>
            <CardDescription>
              Choose your donation amount and payment method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Donation Amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max="100000"
                  step="0.01"
                  placeholder="25.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  disabled={isProcessing}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum donation: $1.00
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Leave a message with your donation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                disabled={isProcessing}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/500 characters
              </p>
            </div>

            <div className="space-y-3">
              <Label>Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as 'stripe' | 'coinbaseICP')}
                disabled={isProcessing}
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent transition-colors">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                    <div className="font-medium">Credit/Debit Card</div>
                    <div className="text-sm text-muted-foreground">
                      Pay securely with Stripe
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent transition-colors">
                  <RadioGroupItem value="coinbaseICP" id="coinbaseICP" />
                  <Label htmlFor="coinbaseICP" className="flex-1 cursor-pointer">
                    <div className="font-medium">ICP Crypto</div>
                    <div className="text-sm text-muted-foreground">
                      Pay with Internet Computer Protocol (simulated)
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              onClick={handleDonate}
              disabled={isProcessing || !amount}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4 fill-current" />
                  Donate ${amount || '0.00'}
                </>
              )}
            </Button>

            {!identity && (
              <p className="text-center text-sm text-muted-foreground">
                Please login to make a donation
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
