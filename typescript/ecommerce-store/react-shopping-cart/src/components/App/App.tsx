import { useEffect } from 'react';

import Loader from 'components/Loader';
import Filter from 'components/Filter';
import {Products, MiniProducts} from 'components/Products';
import Cart from 'components/Cart';

import { useProducts } from 'contexts/products-context';

import * as S from './style';
import { useUser } from 'contexts/user-context';
import { IProduct } from 'models';

function App() {
  const { isFetching, products, fetchProducts } = useProducts();
  const { user, fetchUser, isLoadingUser } = useUser();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const convert = (ids: string[] | undefined): IProduct[] => { 
    if (ids === undefined) {
      return [];
    }
    var index = products.reduce(function(map: any, p: IProduct) {
      map[p.id] = p;
      return map;
    }, {});

    let response =  ids.map(id => index[id]); 
    console.log(response);
    return response;
  } 

  return (
    <S.Container>
      {isFetching && <Loader />}
      <S.TwoColumnGrid>
        <S.Side>
          <Filter />
          Hello {user?.user_full_name} ! 
          Purchase history:
          <MiniProducts products={convert(user?.purchase_history)} />
        </S.Side>
        <S.Main>
          <S.MainHeader>
            <p>{products?.length} Product(s) found</p>
          </S.MainHeader>
          <Products products={products} />
        </S.Main>
      </S.TwoColumnGrid>
      <Cart />
    </S.Container>
  );
}

export default App;
