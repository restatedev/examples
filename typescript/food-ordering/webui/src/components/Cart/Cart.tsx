import formatPrice from 'utils/formatPrice';
import CartProducts from './CartProducts';
import { useCart } from 'contexts/cart-context';
import * as S from './style';
import { publishToKafka, sendRequestToRestate } from 'services/sendToRestate';
import { useUser } from 'contexts/user-context';
import { useOrderStatusContext } from '../../contexts/status-context/OrderStatusProvider';
import { useState } from 'react';
import Dropdown from '../Dropdown';

const isKafkaEnabled = process.env.REACT_APP_ENABLE_KAFKA !== 'false';

const Cart = () => {
  const {
    products,
    total,
    isOpen,
    openCart,
    closeCart,
    clearCart,
    details,
    updateCartDetails,
  } = useCart();
  const { user, setNewShoppingCartId } = useUser();
  const { orderStatus, setOrderStatus } = useOrderStatusContext();
  /* Dropdown for delivery time */
  const [deliveryTimeDropdownOpen, setDeliveryTimeDropdown] = useState(false);
  const handleOpen = () => {
    setDeliveryTimeDropdown(!deliveryTimeDropdownOpen);
  };

  const handleDeliveryTime = (delay: number, description: string) => {
    const newDeliveryTime = {
      delivery_delay: delay,
      delivery_delay_description: description,
      delivery_time: new Date(Date.now() + delay).toString(),
    };
    updateCartDetails({ ...details, ...newDeliveryTime });
    setDeliveryTimeDropdown(false);
  };

  /* Dropdown for restaurant selection */
  const [restaurantDropdownOpen, setRestaurantDropdownOpen] = useState(false);
  const handleRestaurantDropdownOpen = () => {
    setRestaurantDropdownOpen(!restaurantDropdownOpen);
  };

  const handleRestaurantSelection = (
    restaurantId: string,
    restaurant: string
  ) => {
    const newRestaurant = {
      restaurant_id: restaurantId,
      restaurant: restaurant,
    };
    updateCartDetails({ ...details, ...newRestaurant });
    setRestaurantDropdownOpen(false);
  };

  const handleCheckout = () => {
    if (!total.productQuantity) {
      alert('Add some product in the cart!');
      return;
    }

    const generateJsonReq = () => {
      const productsToSend = products.map((prod) => {
        return {
          productId: prod.id,
          description: prod.description,
          quantity: prod.quantity,
        };
      });
      return {
        id: user!.user_id,
        restaurantId: details.restaurant_id,
        products: productsToSend,
        totalCost: total.totalPrice,
        deliveryDelay: details.delivery_delay,
      };
    };

    const kafkaRecord = JSON.stringify({
      key: user!.user_id,
      value: JSON.stringify(generateJsonReq()),
    });
    const request = JSON.stringify({
      key: user!.user_id,
      request: generateJsonReq(),
    });

    const flow = async () => {
      closeCart();
      const checkedOutStatus = { checked_out: true };
      updateCartDetails({ ...details, ...checkedOutStatus });

      if (isKafkaEnabled) {
        console.info('Generating Kafka record');
        console.info(kafkaRecord);
        await publishToKafka(kafkaRecord);
      } else {
        console.info(request);
        sendRequestToRestate('order-workflow', 'create', request);
      }

      let done = false;
      while (!done) {
        const newOrderStatus = (
          await sendRequestToRestate('orderStatus', 'get', {
            key: user!.user_id,
          })
        ).response;
        console.info(newOrderStatus);

        if (newOrderStatus) {
          setOrderStatus(newOrderStatus);
          if (newOrderStatus.status === 'DELIVERED') {
            done = true;
          }
        }
        await new Promise((f) => setTimeout(f, 1000));
      }

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
            <S.CartQuantity title="OrderStatus in cart quantity">
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
            <Dropdown
              open={deliveryTimeDropdownOpen}
              trigger={
                <button style={{ width: '200px' }} onClick={handleOpen}>
                  {details.delivery_delay_description}
                </button>
              }
              menu={[
                <button onClick={() => handleDeliveryTime(0, 'Right now')}>
                  Right now
                </button>,
                <button
                  onClick={() => handleDeliveryTime(5000, 'In 5 seconds')}
                >
                  In 5 seconds
                </button>,
                <button
                  onClick={() => handleDeliveryTime(15000, 'In 15 seconds')}
                >
                  In 15 seconds
                </button>,
              ]}
              dropDownDescription={'Select the delivery time'}
            />
            <Dropdown
              open={restaurantDropdownOpen}
              trigger={
                <button
                  style={{ width: '200px' }}
                  onClick={handleRestaurantDropdownOpen}
                >
                  {details.restaurant}
                </button>
              }
              menu={[
                <button
                  onClick={() =>
                    handleRestaurantSelection('bites_n_bytes', "Bites 'n Bytes")
                  }
                >
                  Bites 'n bytes
                </button>,
                <button
                  onClick={() =>
                    handleRestaurantSelection(
                      'snack_in_the_box',
                      'Snack in the Box'
                    )
                  }
                >
                  Snack in the Box
                </button>,
                <button
                  onClick={() =>
                    handleRestaurantSelection('mcstate', 'McState')
                  }
                >
                  McState
                </button>,
              ]}
              dropDownDescription={'Select the restaurant'}
            />
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
