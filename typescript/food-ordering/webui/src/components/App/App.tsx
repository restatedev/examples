import { useEffect, useState } from 'react';

import Loader from 'components/Loader';
import Filter from 'components/Filter';
import { Products, MiniProducts } from 'components/Products';
import Cart from 'components/Cart';
import OrderStatus from 'components/OrderStatus';

import { useProducts } from 'contexts/products-context';

import * as S from './style';
import { useUser } from 'contexts/user-context';
import { IProduct } from 'models';
import { useCart } from '../../contexts/cart-context';

function App() {
  const { isFetching, products, fetchProducts } = useProducts();
  const { user, fetchUser } = useUser();
  const { details } = useCart();

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
    var index = products.reduce(function (map: any, p: IProduct) {
      map[p.id] = p;
      return map;
    }, {});

    let response = ids.map((id) => index[id]);
    console.log(response);
    return response;
  };

  return (
    <S.Container>
      {isFetching && <Loader />}
      <S.TwoColumnGrid>
        <S.Side>
          {!details.checked_out ? <Filter /> : <div></div>}
          {!details.checked_out ? (
            <p>Hello {user?.user_full_name} !</p>
          ) : (
            <div></div>
          )}
        </S.Side>
        {!details.checked_out ? (
          <S.Main>
            <S.MainHeader>
              <p>{products?.length} Product(s) found</p>
            </S.MainHeader>
            <Products products={products} />
          </S.Main>
        ) : (
          <S.Main>
            <OrderStatus />
          </S.Main>
        )}
      </S.TwoColumnGrid>
      {!details.checked_out ? <Cart /> : <div></div>}
    </S.Container>
  );
}

export default App;
