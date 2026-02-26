import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ShoppingCart {
    id: string;
    productIds: Array<ProductId>;
    userId: Principal;
    quantities: Array<bigint>;
}
export type OrderId = string;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PaymentResult {
    orderId?: OrderId;
    message: string;
    success: boolean;
}
export interface ProductDetails {
    id: ProductId;
    name: string;
    description: string;
    image: ExternalBlob;
    price: bigint;
}
export interface DonationRequest {
    paymentMethod: PaymentMethod;
    message: string;
    currency: string;
    amount: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface DonationRecord {
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    message: string;
    currency: string;
    timestamp: bigint;
    amount: bigint;
    donor: Principal;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface OrderDetails {
    id: OrderId;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    productIds: Array<ProductId>;
    userId: Principal;
    totalAmount: bigint;
    timestamp: bigint;
    quantities: Array<bigint>;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export type ProductId = string;
export interface UserProfile {
    name: string;
}
export enum OrderStatus {
    shipped = "shipped",
    pending = "pending",
    completed = "completed"
}
export enum PaymentMethod {
    stripe = "stripe",
    coinbaseICP = "coinbaseICP"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(product: ProductDetails): Promise<ProductDetails>;
    addToCart(cartId: string, productId: ProductId, quantity: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createOrder(cartId: string, paymentMethod: PaymentMethod): Promise<OrderDetails | null>;
    deleteProduct(productId: ProductId): Promise<void>;
    donate(request: DonationRequest): Promise<DonationRecord>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(cartId: string): Promise<ShoppingCart | null>;
    getOrders(): Promise<Array<OrderDetails>>;
    getProduct(productId: ProductId): Promise<ProductDetails | null>;
    getProducts(): Promise<Array<ProductDetails>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    processCoinbasePayment(orderId: OrderId): Promise<PaymentResult>;
    removeFromCart(cartId: string, productId: ProductId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setOrderStatus(orderId: OrderId, status: OrderStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    storeFile(blob: ExternalBlob): Promise<void>;
    storeImage(blob: ExternalBlob): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateProduct(product: ProductDetails): Promise<ProductDetails>;
}
