import * as S from './style';
import { useUser } from '../../contexts/user-context';
import { useOrderStatusContext } from '../../contexts/status-context/OrderStatusProvider';
import { Done, Tobedone } from './style';
import CartProducts from '../Cart/CartProducts';
import { useCart } from '../../contexts/cart-context';
import { Share } from 'react-twitter-widgets';
import { ICartProduct } from 'models';
import { ClockLoader } from 'react-spinners';
import React from 'react';

const tweetText = (products: ICartProduct[]): string => {
  const productDescriptions = products
    .map((p) => `${p.description}`)
    .join(' and, ');
  return `I've just (virtually) ordered ${productDescriptions} with`;
};

const Tweet = () => {
  const { products } = useCart();

  const text = tweetText(products);

  return (
    <S.Container>
      <h2>Share your order - feed the Twitter feed!</h2>
      <Share
        url="https://restate.dev"
        options={{
          hashtags: 'Current2023,restatedev',
          size: 'large',
          text: tweetText(products),
        }}
      />
    </S.Container>
  );
};

const TBD = ({ text }: { text: string }) => {
  return (
    <S.SimpleContainer>
      <ClockLoader title={text} size="20px" /> {text}
    </S.SimpleContainer>
  );
};

enum OrderState {
  NEW = 0,
  CREATED = 1,
  SCHEDULED = 2,
  IN_PREPARATION = 3,
  SCHEDULED_DELIVERY = 4,
  WAITING_FOR_DRIVER = 5,
  IN_DELIVERY = 6,
  DELIVERED = 7,
}

// Define the possible statuses and their corresponding progress values
const STATUS_PROGRESS = new Map<string, number>([
  ['NEW', OrderState.NEW],
  ['CREATED', OrderState.CREATED],
  ['SCHEDULED', OrderState.SCHEDULED],
  ['IN_PREPARATION', OrderState.IN_PREPARATION],
  ['SCHEDULING_DELIVERY', OrderState.SCHEDULED_DELIVERY],
  ['WAITING_FOR_DRIVER', OrderState.WAITING_FOR_DRIVER],
  ['IN_DELIVERY', OrderState.IN_DELIVERY],
  ['DELIVERED', OrderState.DELIVERED],
]);

const OrderStateContext = React.createContext(OrderState.NEW);

const OrderItem2 = ({
  me,
  before,
  during,
  after,
}: {
  me: OrderState;
  before: JSX.Element;
  during?: JSX.Element;
  after: JSX.Element;
}) => {
  const status = React.useContext(OrderStateContext);

  if (status < me) {
    return before;
  }
  if (status === me) {
    return during ?? after;
  }
  return after;
};

const OrderItem = ({
  me,
  txt,
  done,
}: {
  me: OrderState;
  txt: string;
  done: string;
}) => {
  const status = React.useContext(OrderStateContext);
  if (status < me) {
    return <TBD text={txt} />;
  }
  return (
    <Done>
      {done} {txt}
    </Done>
  );
};

export const OrderStatus = () => {
  const { orderStatus, setOrderStatus } = useOrderStatusContext();
  const {
    products,
    openCart,
    closeCart,
    clearCart,
    details,
    updateCartDetails,
  } = useCart();
  const { user, fetchUser, isLoadingUser } = useUser();

  const status = orderStatus?.status || 'NEW';

  const currentProgress: OrderState =
    STATUS_PROGRESS.get(status) ?? OrderState.NEW;

  const etaSeconds = orderStatus ? Math.round(orderStatus.eta / 1000) : 0;

  return (
    <S.Container>
      <div>
        <h1>Purchase overview</h1>
      </div>

      <div>
        <p>
          Order ID: <b>{user?.user_id}</b>
        </p>
      </div>
      <div>
        <p>
          Restaurant: <b>{details.restaurant}</b>
        </p>
      </div>
      <div>
        <p>
          Desired delivery time:{' '}
          <b>
            {details.delivery_delay_description}: {details.delivery_time}
          </b>
        </p>
      </div>

      <div>
        <h2>Status:</h2>
      </div>
      <div>
        <OrderStateContext.Provider value={currentProgress}>
          <ul className="list-inline items d-flex">
            <li>
              <OrderItem me={OrderState.CREATED} txt={'Created'} done="📝" />
            </li>
            <li>
              <OrderItem
                me={OrderState.SCHEDULED}
                txt={'Scheduled'}
                done="🕧"
              />
            </li>
            <li>
              <OrderItem
                me={OrderState.IN_PREPARATION}
                txt={'Preparing'}
                done="🧑‍🍳"
              />
            </li>
            <li>
              <OrderItem
                me={OrderState.SCHEDULED_DELIVERY}
                txt={'Scheduling delivery'}
                done="🎙️"
              />
            </li>
            <li>
              <OrderItem2
                me={OrderState.WAITING_FOR_DRIVER}
                before={<TBD text="Waiting for a driver" />}
                after={<Done>🪪 Waiting for driver </Done>}
                during={
                  <Done>🔜 Waiting for a driver. ETA {etaSeconds} seconds</Done>
                }
              />
            </li>
            <li>
              <OrderItem2
                me={OrderState.IN_DELIVERY}
                before={<TBD text="In delivery" />}
                after={<Done>✅ In delivery </Done>}
                during={<Done>🚴 Delivery. ETA {etaSeconds} seconds</Done>}
              />
            </li>
            <li>
              <OrderItem
                me={OrderState.DELIVERED}
                txt={'Delivered'}
                done="😋"
              />
            </li>
          </ul>
        </OrderStateContext.Provider>
      </div>
      <div>{currentProgress >= OrderState.DELIVERED && <Tweet />}</div>
      <div>
        <h2>Your Order:</h2>
      </div>
      <CartProducts products={products} />
    </S.Container>
  );
};

export default OrderStatus;
