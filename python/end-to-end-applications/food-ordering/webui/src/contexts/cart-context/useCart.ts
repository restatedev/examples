import { useCartContext } from './CartContextProvider';
import useCartProducts from './useCartProducts';
import useCartTotal from './useCartTotal';
import useCartDetails from './useCartDetails';

const useCart = () => {
  const { isOpen, setIsOpen } = useCartContext();
  const {
    products,
    addProduct,
    removeProduct,
    increaseProductQuantity,
    decreaseProductQuantity,
    clearCart,
  } = useCartProducts();
  const { total, updateCartTotal } = useCartTotal();
  const { details, updateCartDetails } = useCartDetails();

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  return {
    isOpen,
    openCart,
    closeCart,
    products,
    addProduct,
    removeProduct,
    increaseProductQuantity,
    decreaseProductQuantity,
    total,
    updateCartTotal,
    clearCart,
    details,
    updateCartDetails,
  };
};

export default useCart;
