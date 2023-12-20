import axios from 'axios';

export const getProducts = async () => {
  let response = await axios.get('/products.json');
  const { products } = response.data.data;
  return products;
};
