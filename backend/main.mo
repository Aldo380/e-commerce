import Text "mo:core/Text";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import OutCall "http-outcalls/outcall";
import Stripe "stripe/stripe";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type ProductId = Text;
  type OrderId = Text;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type ProductDetails = {
    id : ProductId;
    name : Text;
    description : Text;
    price : Nat;
    image : Storage.ExternalBlob;
  };

  public type ShoppingCartItem = {
    productId : ProductId;
    quantity : Nat;
  };

  public type OrderStatus = {
    #pending;
    #completed;
    #shipped;
  };

  public type PaymentMethod = {
    #stripe;
    #coinbaseICP;
  };

  public type OrderDetails = {
    id : OrderId;
    userId : Principal;
    productIds : [ProductId];
    quantities : [Nat];
    totalAmount : Nat;
    paymentMethod : PaymentMethod;
    status : OrderStatus;
    timestamp : Int;
  };

  public type ShoppingCart = {
    id : Text;
    userId : Principal;
    productIds : [ProductId];
    quantities : [Nat];
  };

  public type PaymentResult = {
    success : Bool;
    message : Text;
    orderId : ?OrderId;
  };

  public type Store = {
    products : Map.Map<Text, ProductDetails>;
    orders : Map.Map<Text, OrderDetails>;
    shoppingCarts : Map.Map<Text, ShoppingCart>;
  };

  public type UserProfile = {
    name : Text;
  };

  public type DonationRequest = {
    amount : Nat;
    currency : Text;
    message : Text;
    paymentMethod : PaymentMethod;
  };

  public type DonationRecord = {
    donor : Principal;
    amount : Nat;
    currency : Text;
    message : Text;
    paymentMethod : PaymentMethod;
    timestamp : Int;
    status : OrderStatus;
  };

  let products = Map.empty<ProductId, ProductDetails>();
  let orders = Map.empty<OrderId, OrderDetails>();
  let shoppingCarts = Map.empty<Text, ShoppingCart>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let donations = Map.empty<Int, DonationRecord>();

  var nextProductId = 1;
  var nextOrderId = 1;
  var nextDonationId = 1;

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Storage management
  public shared ({ caller }) func storeFile(blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    ignore blob;
  };

  public shared ({ caller }) func storeImage(blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    resetStore();
  };

  func resetStore() {
    products.clear();
    orders.clear();
    shoppingCarts.clear();
  };

  // Product management
  func generateProductId(productName : Text) : Text {
    let id = productName.concat(nextProductId.toText());
    nextProductId += 1;
    id;
  };

  public shared ({ caller }) func addProduct(product : ProductDetails) : async ProductDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let id = generateProductId(product.name);
    let productWithId = { product with id };
    products.add(id, productWithId);
    productWithId;
  };

  public shared ({ caller }) func updateProduct(product : ProductDetails) : async ProductDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (products.get(product.id)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?_) {
        products.add(product.id, product);
        product;
      };
    };
  };

  public query ({ caller }) func getProducts() : async [ProductDetails] {
    products.values().toArray();
  };

  public query ({ caller }) func getProduct(productId : ProductId) : async ?ProductDetails {
    products.get(productId);
  };

  public shared ({ caller }) func deleteProduct(productId : ProductId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?_) { products.remove(productId) };
    };
  };

  // Shopping cart management
  public shared ({ caller }) func addToCart(cartId : Text, productId : ProductId, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add to cart");
    };
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?_) {
        switch (shoppingCarts.get(cartId)) {
          case (null) {
            shoppingCarts.add(
              cartId,
              {
                id = cartId;
                userId = caller;
                productIds = [productId];
                quantities = [quantity];
              },
            );
          };
          case (?cart) {
            if (cart.userId != caller) {
              Runtime.trap("Unauthorized: Can only modify your own cart");
            };
            let newProductIds = cart.productIds.concat([productId]);
            let newQuantities = cart.quantities.concat([quantity]);
            shoppingCarts.add(
              cart.id,
              { cart with productIds = newProductIds; quantities = newQuantities },
            );
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeFromCart(cartId : Text, productId : ProductId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove from cart");
    };
    switch (shoppingCarts.get(cartId)) {
      case (null) { Runtime.trap("Invalid shopping cart or product does not exist") };
      case (?cart) {
        if (cart.userId != caller) {
          Runtime.trap("Unauthorized: Can only modify your own cart");
        };
        let productIdsArray = cart.productIds;
        let quantitiesArray = cart.quantities;

        var foundIndex : ?Nat = null;
        for (i in productIdsArray.keys()) {
          if (productIdsArray[i] == productId) {
            foundIndex := ?i;
          };
        };

        switch (foundIndex) {
          case (null) { Runtime.trap("Item not found in cart") };
          case (?_) {
            shoppingCarts.add(cart.id, { cart with productIds = []; quantities = [] });
          };
        };
      };
    };
  };

  public query ({ caller }) func getCart(cartId : Text) : async ?ShoppingCart {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access carts");
    };
    switch (shoppingCarts.get(cartId)) {
      case (null) { null };
      case (?cart) {
        if (cart.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access your own cart");
        };
        ?cart;
      };
    };
  };

  // Order management
  public query ({ caller }) func getOrders() : async [OrderDetails] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    let allOrders = orders.values().toArray();

    if (AccessControl.isAdmin(accessControlState, caller)) {
      allOrders;
    } else {
      allOrders.filter(func(order : OrderDetails) : Bool { order.userId == caller });
    };
  };

  public shared ({ caller }) func setOrderStatus(orderId : OrderId, status : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order does not exist") };
      case (?order) {
        let updatedOrder = { order with status };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  func generateOrderId(cartId : Text) : OrderId {
    let id = cartId.concat(nextOrderId.toText());
    nextOrderId += 1;
    id;
  };

  public shared ({ caller }) func createOrder(cartId : Text, paymentMethod : PaymentMethod) : async ?OrderDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orders");
    };
    switch (shoppingCarts.get(cartId)) {
      case (null) { Runtime.trap("Shopping cart does not exist") };
      case (?cart) {
        if (cart.userId != caller) {
          Runtime.trap("Unauthorized: Can only create orders from your own cart");
        };
        let orderId = generateOrderId(cartId);
        let order : OrderDetails = {
          id = orderId;
          userId = caller;
          productIds = cart.productIds;
          quantities = cart.quantities;
          totalAmount = 100;
          paymentMethod;
          status = #pending;
          timestamp = Time.now();
        };

        orders.add(orderId, order);
        ?order;
      };
    };
  };

  // Payment processing
  var configuration : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    configuration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    configuration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (configuration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func processCoinbasePayment(orderId : OrderId) : async PaymentResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can process payments");
    };

    switch (orders.get(orderId)) {
      case (null) {
        {
          success = false;
          message = "Order not found";
          orderId = null;
        };
      };
      case (?order) {
        if (order.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only process payment for your own orders");
        };

        if (order.status == #completed) {
          return {
            success = false;
            message = "Order is already completed";
            orderId = ?orderId;
          };
        };
        let updatedOrder = { order with status = #completed };
        orders.add(orderId, updatedOrder);

        {
          success = true;
          message = "Payment successful (simulated)";
          orderId = ?orderId;
        };
      };
    };
  };

  // Charity donation endpoint
  public shared ({ caller }) func donate(request : DonationRequest) : async DonationRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can make donations");
    };

    let donationId = nextDonationId;
    nextDonationId += 1;

    let donation : DonationRecord = {
      donor = caller;
      amount = request.amount;
      currency = request.currency;
      message = request.message;
      paymentMethod = request.paymentMethod;
      timestamp = Time.now();
      status = #pending;
    };

    donations.add(donationId, donation);

    donation;
  };
};
