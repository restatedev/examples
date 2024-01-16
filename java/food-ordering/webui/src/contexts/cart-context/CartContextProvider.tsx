import { createContext, useContext, FC, useState } from 'react';
import { ICartDetails, ICartProduct, ICartTotal } from 'models';

export interface ICartContext {
  isOpen: boolean;
  setIsOpen(state: boolean): void;
  products: ICartProduct[];
  setProducts(products: ICartProduct[]): void;
  total: ICartTotal;
  setTotal(products: any): void;
  details: ICartDetails;
  setDetails(details: ICartDetails): void;
}

const CartContext = createContext<ICartContext | undefined>(undefined);
const useCartContext = (): ICartContext => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }

  return context;
};

const totalInitialValues = {
  productQuantity: 0,
  installments: 0,
  totalPrice: 0,
  currencyId: 'USD',
  currencyFormat: '$',
};

const detailsInitialValues = {
  delivery_time: new Date(Date.now()).toString(),
  delivery_delay: 0,
  delivery_delay_description: 'Right now',
  restaurant_id: 'bites_n_bytes',
  restaurant: "Bites 'n Bytes",
  checked_out: false,
};

const CartProvider: FC = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<ICartProduct[]>([]);
  const [total, setTotal] = useState<ICartTotal>(totalInitialValues);
  const [details, setDetails] = useState<ICartDetails>(detailsInitialValues);

  const CartContextValue: ICartContext = {
    isOpen,
    setIsOpen,
    products,
    setProducts,
    total,
    setTotal,
    details,
    setDetails,
  };

  return <CartContext.Provider value={CartContextValue} {...props} />;
};

export { CartProvider, useCartContext };
