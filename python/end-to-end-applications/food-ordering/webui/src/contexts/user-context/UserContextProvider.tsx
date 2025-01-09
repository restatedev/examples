import { createContext, useContext, FC, useState } from 'react';

import { IUser } from 'models';

export interface IUserContext {
  user?: IUser;
  setUser(user: IUser): void;
  isLoadingUser: boolean;
  setLoadingUser(loading: boolean): void;
}

const UserContext = createContext<IUserContext | undefined>(undefined);
const useUserContext = (): IUserContext => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUserContext must be used within a ProductsProvider');
  }

  return context;
};

const UserProvider: FC = (props) => {
  const [user, setUser] = useState<IUser | undefined>(undefined);
  const [isLoadingUser, setLoadingUser] = useState<boolean>(false);

  const UserContextValue: IUserContext = {
    user,
    setUser,
    isLoadingUser,
    setLoadingUser,
  };

  return <UserContext.Provider value={UserContextValue} {...props} />;
};

export { UserProvider, useUserContext };
