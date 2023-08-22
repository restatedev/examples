import { useCartContext } from './CartContextProvider';
import useCartTotal from './useCartTotal';
import { ICartProduct } from 'models';
import { useEffect } from 'react';
import { grpc } from 'services/grpc';
import { useUser } from 'contexts/user-context';

const useCartProducts = () => {
  const { products, setProducts } = useCartContext();
  const { updateCartTotal } = useCartTotal();
  const { user } = useUser();

  const updateQuantitySafely = (
    currentProduct: ICartProduct,
    targetProduct: ICartProduct,
    quantity: number
  ): ICartProduct => {
    if (currentProduct.id === targetProduct.id) {
      return Object.assign({
        ...currentProduct,
        quantity: currentProduct.quantity + quantity,
      });
    } else {
      return currentProduct;
    }
  };

  const addProduct = (newProduct: ICartProduct) => {
    let updatedProducts;
    const isProductAlreadyInCart = products.some(
      (product: ICartProduct) => newProduct.id === product.id
    );

    if (isProductAlreadyInCart) {
      // TODO: make this a noop, or maybe a popup.
      //updatedProducts = products.map((product: ICartProduct) => {
      //  return updateQuantitySafely(product, newProduct, newProduct.quantity);
      //});
      alert(`${newProduct.description} was already added`);
      updatedProducts = products;
    } else {
      const req = { "shopping_cart_id" : user!.shopping_cart_id, "product_id" : ""+newProduct.id};
      grpc('ShoppingCartService', 'AddProduct', req).then((res: any) => {
        if (res.success) {
          updatedProducts = [...products, newProduct];
          setProducts(updatedProducts);
          updateCartTotal(updatedProducts);
        } else {
          alert(`Unable to add the product to the shopping cart.`);
        }
      });
    }

  };

  const removeProduct = (productToRemove: ICartProduct) => {
    const updatedProducts = products.filter(
      (product: ICartProduct) => product.id !== productToRemove.id
    );
    const req = { "shopping_cart_id": user!.shopping_cart_id, "product_id": productToRemove.id };

    grpc('ShoppingCartService', 'RemoveProduct', req).then((res: any) => {
      setProducts(updatedProducts);
      updateCartTotal(updatedProducts);
    });
  };

  const increaseProductQuantity = (productToIncrease: ICartProduct) => {
    const updatedProducts = products.map((product: ICartProduct) => {
      return updateQuantitySafely(product, productToIncrease, +1);
    });

    setProducts(updatedProducts);
    updateCartTotal(updatedProducts);
  };

  const decreaseProductQuantity = (productToDecrease: ICartProduct) => {
    const updatedProducts = products.map((product: ICartProduct) => {
      return updateQuantitySafely(product, productToDecrease, -1);
    });

    setProducts(updatedProducts);
    updateCartTotal(updatedProducts);
  };

  const clearCart = () => {
    setProducts([]);
    updateCartTotal([]);
  };

  return {
    products,
    addProduct,
    removeProduct,
    increaseProductQuantity,
    decreaseProductQuantity,
    clearCart,
  };
};

export default useCartProducts;
