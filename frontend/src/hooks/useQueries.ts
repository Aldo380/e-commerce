import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ProductDetails, OrderDetails, ShoppingCart, UserProfile, PaymentMethod, OrderStatus, ShoppingItem, StripeConfiguration, DonationRequest, DonationRecord } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Product Queries
export function useGetProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<ProductDetails[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProduct(productId: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<ProductDetails | null>({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!actor || !productId) return null;
      return actor.getProduct(productId);
    },
    enabled: !!actor && !isFetching && !!productId,
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductDetails) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductDetails) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Cart Queries
export function useGetCart(cartId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ShoppingCart | null>({
    queryKey: ['cart', cartId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCart(cartId);
    },
    enabled: !!actor && !isFetching && !!cartId,
  });
}

export function useAddToCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, productId, quantity }: { cartId: string; productId: string; quantity: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addToCart(cartId, productId, quantity);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.cartId] });
    },
  });
}

export function useRemoveFromCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, productId }: { cartId: string; productId: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.removeFromCart(cartId, productId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.cartId] });
    },
  });
}

// Order Queries
export function useGetOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<OrderDetails[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartId, paymentMethod }: { cartId: string; paymentMethod: PaymentMethod }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOrder(cartId, paymentMethod);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useSetOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Payment Queries
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
    },
  });
}

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (items: ShoppingItem[]): Promise<CheckoutSession> => {
      if (!actor) throw new Error('Actor not available');
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;
      const result = await actor.createCheckoutSession(items, successUrl, cancelUrl);
      const session = JSON.parse(result) as CheckoutSession;
      return session;
    },
  });
}

export function useProcessCoinbasePayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.processCoinbasePayment(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Donation Queries
export function useDonate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: DonationRequest): Promise<DonationRecord> => {
      if (!actor) throw new Error('Actor not available');
      return actor.donate(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      toast.success('Thank you for your donation!');
    },
  });
}

export function useGetDonations() {
  const { actor, isFetching } = useActor();

  return useQuery<DonationRecord[]>({
    queryKey: ['donations'],
    queryFn: async () => {
      if (!actor) return [];
      // Note: Backend doesn't have a getDonations method yet
      // This will need to be implemented in the backend
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}
