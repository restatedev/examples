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
  
      const newShoppingCartId = uuidv4().replaceAll('-', '');

      setLoadingUser(false);
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
