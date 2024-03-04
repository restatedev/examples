import formatPrice from 'utils/formatPrice';
import CartProducts from './CartProducts';

import { useCart } from 'contexts/cart-context';

import * as S from './style';
import { grpc } from 'services/grpc';
import { useUser } from 'contexts/user-context';

const Cart = () => {
  const { products, total, isOpen, openCart, closeCart, clearCart } = useCart();
  const {user, setNewShoppingCartId} = useUser();

  const handleCheckout = () => {
    if (!total.productQuantity) {
      alert('Add some product in the cart!');
      return;
    }

    const flow = async () => {
      const req = { shopping_cart_id: user!.shopping_cart_id };
      const res  = await grpc('ShoppingCartService', 'Checkout', req);

      if (!('checkoutSuccess' in res)) {
        alert(`Checkout failure : ${res.response}`);
        return;
      }
      clearCart();
      alert(`Success! your tracking number is ${res.checkoutSuccess.trackingNumber}`);

      setNewShoppingCartId();
    };

    flow();
    
  };

  const handleToggleCart = (isOpen: boolean) => () =>
    isOpen ? closeCart() : openCart();

  return (
    <S.Container isOpen={isOpen}>
      <S.CartButton onClick={handleToggleCart(isOpen)}>
        {isOpen ? (
          <span>X</span>
        ) : (
          <S.CartIcon>
            <S.CartQuantity title="Products in cart quantity">
              {total.productQuantity}
            </S.CartQuantity>
          </S.CartIcon>
        )}
      </S.CartButton>

      {isOpen && (
        <S.CartContent>
          <S.CartContentHeader>
            <S.CartIcon large>
              <S.CartQuantity>{total.productQuantity}</S.CartQuantity>
            </S.CartIcon>
            <S.HeaderTitle>Cart</S.HeaderTitle>
          </S.CartContentHeader>

          <CartProducts products={products} />

          <S.CartFooter>
            <S.Sub>SUBTOTAL</S.Sub>
            <S.SubPrice>
              <S.SubPriceValue>{`${total.currencyFormat} ${formatPrice(
                total.totalPrice,
                total.currencyId
              )}`}</S.SubPriceValue>
              <S.SubPriceInstallment>
                {total.installments ? (
                  <span>
                    {`OR UP TO ${total.installments} x ${
                      total.currencyFormat
                    } ${formatPrice(
                      total.totalPrice / total.installments,
                      total.currencyId
                    )}`}
                  </span>
                ) : null}
              </S.SubPriceInstallment>
            </S.SubPrice>
            <S.CheckoutButton onClick={handleCheckout} autoFocus>
              Checkout
            </S.CheckoutButton>
          </S.CartFooter>
        </S.CartContent>
      )}
    </S.Container>
  );
};

export default Cart;
