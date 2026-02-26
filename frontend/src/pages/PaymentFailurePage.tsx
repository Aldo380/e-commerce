import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="container py-12">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Unfortunately, your payment could not be processed. Please try again or contact support if the problem persists.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate({ to: '/checkout' })} size="lg">
              Try Again
            </Button>
            <Button onClick={() => navigate({ to: '/' })} variant="outline">
              Back to Shop
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
