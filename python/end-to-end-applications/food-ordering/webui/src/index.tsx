import { StrictMode } from 'react';
import * as ReactDOMClient from 'react-dom/client';

/* Theme */
import { ThemeProvider } from 'commons/style/styled-components';
import { theme } from 'commons/style/theme';
import GlobalStyle from 'commons/style/global-style';

/* Context Providers */
import { UserProvider } from 'contexts/user-context';
import { ProductsProvider } from 'contexts/products-context';
import { CartProvider } from 'contexts/cart-context';

import App from 'components/App';
import { OrderStatusProvider } from './contexts/status-context';

const root = document.getElementById('root')!;
const container = ReactDOMClient.createRoot(root);

container.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <UserProvider>
        <ProductsProvider>
          <OrderStatusProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </OrderStatusProvider>
        </ProductsProvider>
      </UserProvider>
    </ThemeProvider>
  </StrictMode>
);
