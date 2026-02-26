import { useState } from 'react';
import { useGetProducts, useAddProduct, useUpdateProduct, useDeleteProduct, useIsCallerAdmin, useGetOrders, useSetOrderStatus, useIsStripeConfigured } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { ExternalBlob, type ProductDetails, OrderStatus, PaymentMethod } from '../backend';
import StripeSetupDialog from '../components/StripeSetupDialog';

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: products } = useGetProducts();
  const { data: orders } = useGetOrders();
  const { data: stripeConfigured } = useIsStripeConfigured();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const setOrderStatus = useSetOrderStatus();

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isStripeDialogOpen, setIsStripeDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetails | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    imageFile: null as File | null,
  });

  if (!identity) {
    navigate({ to: '/' });
    return null;
  }

  if (adminLoading) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Access denied. Admin privileges required.</p>
            <Button onClick={() => navigate({ to: '/' })}>Go to Products</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.name || !productForm.description || !productForm.price) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!editingProduct && !productForm.imageFile) {
      toast.error('Please select an image');
      return;
    }

    try {
      const priceInCents = Math.round(parseFloat(productForm.price) * 100);

      let imageBlob: ExternalBlob;
      if (productForm.imageFile) {
        const arrayBuffer = await productForm.imageFile.arrayBuffer();
        imageBlob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
      } else if (editingProduct) {
        imageBlob = editingProduct.image;
      } else {
        throw new Error('No image provided');
      }

      const productData: ProductDetails = {
        id: editingProduct?.id || '',
        name: productForm.name,
        description: productForm.description,
        price: BigInt(priceInCents),
        image: imageBlob,
      };

      if (editingProduct) {
        await updateProduct.mutateAsync(productData);
        toast.success('Product updated successfully');
      } else {
        await addProduct.mutateAsync(productData);
        toast.success('Product added successfully');
      }

      setIsProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', imageFile: null });
    } catch (error) {
      console.error('Product error:', error);
      toast.error('Failed to save product');
    }
  };

  const handleEditProduct = (product: ProductDetails) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: (Number(product.price) / 100).toString(),
      imageFile: null,
    });
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct.mutateAsync(productId);
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: string) => {
    try {
      const orderStatus: OrderStatus = status === 'completed' ? OrderStatus.completed : status === 'shipped' ? OrderStatus.shipped : OrderStatus.pending;
      await setOrderStatus.mutateAsync({ orderId, status: orderStatus });
      toast.success('Order status updated');
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update order status');
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    return method === PaymentMethod.stripe ? 'Card' : 'ICP Crypto';
  };

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => setIsStripeDialogOpen(true)} variant="outline">
          {stripeConfigured ? 'Reconfigure Stripe' : 'Setup Stripe'}
        </Button>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="mb-8">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Manage Products</h2>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ name: '', description: '', price: '', imageFile: null });
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Product Image</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProductForm({ ...productForm, imageFile: e.target.files?.[0] || null })}
                    />
                    {editingProduct && !productForm.imageFile && (
                      <p className="text-xs text-muted-foreground">Leave empty to keep current image</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={addProduct.isPending || updateProduct.isPending}>
                      {addProduct.isPending || updateProduct.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products?.map((product) => {
              const priceInDollars = Number(product.price) / 100;
              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted mb-4">
                      <img src={product.image.getDirectURL()} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                    <p className="text-xl font-bold mb-4">${priceInDollars.toFixed(2)}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)} className="flex-1">
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)} className="flex-1">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <h2 className="text-2xl font-semibold mb-6">Manage Orders</h2>
          <div className="space-y-4">
            {orders?.map((order) => {
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
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleOrderStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Customer: </span>
                        <span className="font-mono text-xs">{order.userId.toString().slice(0, 20)}...</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Items: </span>
                        <span>{order.productIds.length}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Payment: </span>
                        <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <StripeSetupDialog open={isStripeDialogOpen} onOpenChange={setIsStripeDialogOpen} />
    </div>
  );
}
