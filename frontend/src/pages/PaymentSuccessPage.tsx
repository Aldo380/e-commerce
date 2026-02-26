import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="container py-12">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order has been confirmed and will be processed shortly.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate({ to: '/orders' })} size="lg">
              View Orders
            </Button>
            <Button onClick={() => navigate({ to: '/' })} variant="outline">
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
