import { useCallback } from 'react';
import { useOrderStatusContext } from './OrderStatusProvider';
import { getStatus } from '../../services/sendToRestate';
import { useUserContext } from '../user-context/UserContextProvider';

const useOrderStatus = () => {
  const { orderStatus, setOrderStatus } = useOrderStatusContext();
  const { user } = useUserContext();

  const fetchOrderStatus = useCallback(() => {
    if (user) {
      console.debug(`Found user ${user}`);
      getStatus(user!.shopping_cart_id).then((response) => {
        setOrderStatus(response);
      });
    } else {
      console.debug("Didn't find user");
      setOrderStatus({ eta: 0, status: 'NEW' });
    }
  }, []);

  return {
    orderStatus,
    fetchOrderStatus,
    setOrderStatus,
  };
};

export default useOrderStatus;
