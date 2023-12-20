export interface IProduct {
  id: number;
  sku: number;
  title: string;
  description: string;
  availableSizes: string[];
  style: string;
  price: number;
  installments: number;
  currencyId: string;
  currencyFormat: string;
  isFreeShipping: boolean;
}

export interface ICartProduct extends IProduct {
  quantity: number;
}

export interface ICartTotal {
  productQuantity: number;
  installments: number;
  totalPrice: number;
  currencyId: string;
  currencyFormat: string;
}

export interface IUser {
  user_id: string;
  user_full_name: string;
  payment_method_identifier: string;
  shipping_address: string;
  email_address: string;
  shopping_cart_id: string;
  purchase_history: string[];
}

export interface IOrderStatus {
  eta: number;
  status: string;
}

export interface ICartDetails {
  delivery_delay: number;
  delivery_delay_description: string;
  delivery_time: string;
  restaurant_id: string;
  restaurant: string;
  checked_out: boolean;
}
