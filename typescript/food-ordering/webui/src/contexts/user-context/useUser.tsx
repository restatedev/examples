import { useCallback } from 'react';

import { useUserContext } from './UserContextProvider';
import { IUser } from 'models';
import { whoami } from 'services/whoami';
import { v4 as uuidv4 } from 'uuid';

const useUser = () => {
  const { user, setUser, isLoadingUser, setLoadingUser } = useUserContext();

  const fetchUser = useCallback(() => {
    setLoadingUser(true);
    whoami().then((u: IUser) => {
      setLoadingUser(false);
      setUser(u);
    });
  }, []);

  const setNewShoppingCartId = () => {
    setLoadingUser(true);

    (async () => {
      //
      // fetch the updated user profile, with the recent purchase history.
      //
      // const {
      //   userId,
      //   userFullName,
      //   paymentMethodIdentifier,
      //   shippingAddress,
      //   emailAddress,
      //   purchaseHistory
      // } = await sendRequestToRestate('UserProfileService', 'GetUserProfile', { user_id: user!.user_id });

      //
      // register a new shopping cart with the backend
      //
      const newShoppingCartId = uuidv4().replaceAll('-', '');

      // await sendRequestToRestate('ShoppingCartService', 'CreateCart', {shopping_cart_id: newShoppingCartId, user_id: userId});

      //
      // set the new user
      //
      // const newUser: IUser = {
      //   user_id : userId,
      //   user_full_name: userFullName,
      //   payment_method_identifier: paymentMethodIdentifier,
      //   shipping_address: shippingAddress,
      //   email_address: emailAddress,
      //   purchase_history: purchaseHistory,
      //   shopping_cart_id: newShoppingCartId
      // };

      setLoadingUser(false);
      // setUser(newUser);
    })();
  };

  return {
    user,
    fetchUser,
    isLoadingUser,
    setNewShoppingCartId,
  };
};

export default useUser;
