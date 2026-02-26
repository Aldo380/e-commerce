import { useGetOrders, useGetProducts, useGetDonations } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentMethod } from '../backend';
import { Heart } from 'lucide-react';

export default function OrdersPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: orders, isLoading: ordersLoading } = useGetOrders();
  const { data: products } = useGetProducts();
  const { data: donations, isLoading: donationsLoading } = useGetDonations();

  if (!identity) {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please login to view your orders and donations</p>
            <Button onClick={() => navigate({ to: '/' })}>Go to Products</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'shipped':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    return method === PaymentMethod.stripe ? 'Card' : 'ICP Crypto';
  };

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">My Orders & Donations</h1>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
                <Button onClick={() => navigate({ to: '/' })}>Start Shopping</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const orderProducts = order.productIds
                  .map((id, index) => {
                    const product = products?.find((p) => p.id === id);
                    return product ? { ...product, quantity: Number(order.quantities[index]) } : null;
                  })
                  .filter(Boolean);

                const totalAmount = Number(order.totalAmount) / 100;
                const date = new Date(Number(order.timestamp) / 1000000);

                return (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                          <p className="text-sm text-muted-foreground">{date.toLocaleDateString()}</p>
                        </div>
                        <Badge variant={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {orderProducts.map((item) => {
                          if (!item) return null;
                          const priceInDollars = Number(item.price) / 100;
                          return (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                {item.name} × {item.quantity}
                              </span>
                              <span>${(priceInDollars * item.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total</span>
                          <span>${totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Payment: {getPaymentMethodLabel(order.paymentMethod)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="donations" className="mt-6">
          {donationsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : !donations || donations.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No donations yet. Make your first donation!</p>
                <Button onClick={() => navigate({ to: '/donate' })}>
                  <Heart className="mr-2 h-4 w-4" />
                  Make a Donation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {donations.map((donation, index) => {
                const amount = Number(donation.amount) / 100;
                const date = new Date(Number(donation.timestamp) / 1000000);

                return (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Heart className="h-5 w-5 fill-destructive text-destructive" />
                          <div>
                            <CardTitle className="text-lg">Donation</CardTitle>
                            <p className="text-sm text-muted-foreground">{date.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(donation.status)}>
                          {donation.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Amount</span>
                          <span>${amount.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Payment: {getPaymentMethodLabel(donation.paymentMethod)}
                        </div>
                        {donation.message && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground italic">
                              "{donation.message}"
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
