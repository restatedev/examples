import { IProduct } from 'models';
import { Product, MiniProduct } from './Product';

import * as S from './style';

interface IProps {
  products: IProduct[];
}

export const Products = ({ products }: IProps) => {
  return (
    <S.Container>
      {products?.map((p) => (
        <Product product={p} key={p.sku} />
      ))}
    </S.Container>
  );
};

export const MiniProducts = ({ products }: IProps) => {
  return (
    <S.Container>
      <ul>
        {products?.map((p) => (
          <MiniProduct product={p} key={p.sku} />
        ))}
      </ul>
    </S.Container>
  );
};
