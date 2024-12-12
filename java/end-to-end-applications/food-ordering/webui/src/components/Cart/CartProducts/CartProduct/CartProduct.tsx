import formatPrice from 'utils/formatPrice';
import { ICartProduct } from 'models';

import { useCart } from 'contexts/cart-context';

import * as S from './style';
import useCartDetails from '../../../../contexts/cart-context/useCartDetails';

interface IProps {
  product: ICartProduct;
}
const CartProduct = ({ product }: IProps) => {
  const { removeProduct, increaseProductQuantity, decreaseProductQuantity } =
    useCart();
  const { details } = useCartDetails();
  const {
    sku,
    title,
    price,
    style,
    currencyId,
    currencyFormat,
    availableSizes,
    quantity,
  } = product;

  const handleRemoveProduct = () => removeProduct(product);
  const handleIncreaseProductQuantity = () => increaseProductQuantity(product);
  const handleDecreaseProductQuantity = () => decreaseProductQuantity(product);

  return (
    <S.Container>
      {!details.checked_out ? (
        <S.DeleteButton
          onClick={handleRemoveProduct}
          title="remove product from cart"
        />
      ) : (
        <div></div>
      )}
      <S.Image
        src={require(`static/products/${sku}-1-product.webp`)}
        alt={title}
      />
      <S.Details>
        {!details.checked_out ? (
          <S.Title>{title}</S.Title>
        ) : (
          <S.DarkTitle>{title}</S.DarkTitle>
        )}
        <S.Desc>
          {`${availableSizes[0]} | ${style}`} <br />
          Quantity: {quantity}
        </S.Desc>
      </S.Details>
      <S.Price>
        <p>{`${currencyFormat}  ${formatPrice(price, currencyId)}`}</p>
      </S.Price>
    </S.Container>
  );
};

export default CartProduct;
