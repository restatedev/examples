import { createContext, useContext, useState } from 'react';
import { IOrderStatus } from 'models';

export interface IOrderStatusContext {
  orderStatus?: IOrderStatus;
  setOrderStatus(orderStatus: IOrderStatus): void;
}

const OrderStatusContext = createContext<IOrderStatusContext | undefined>(
  undefined
);

const useOrderStatusContext = (): IOrderStatusContext => {
  const context = useContext(OrderStatusContext);

  if (!context) {
    throw new Error(
      'no UserOrderContext. You might be calling from the wrong place. '
    );
  }

  return context;
};

type Props = {
  children?: React.ReactNode;
};

const OrderStatusProvider = (props: Props) => {
  const [orderStatus, setOrderStatus] = useState<IOrderStatus>({
    eta: 0,
    status: 'NEW',
  });

  const OrderStatusContextValue: IOrderStatusContext = {
    orderStatus,
    setOrderStatus,
  };

  return (
    <OrderStatusContext.Provider value={OrderStatusContextValue} {...props} />
  );
};

export { OrderStatusProvider, useOrderStatusContext };
