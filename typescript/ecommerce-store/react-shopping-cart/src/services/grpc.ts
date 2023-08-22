import axios from 'axios';

export const grpc = async (service: string, method: string, data: any) => {
  const RESTATE_HOST = process.env.REACT_APP_RESTATE_HOST || "http://localhost:9090"
  return await (await axios.post(`${RESTATE_HOST}/io.shoppingcart.${service}/${method}`, data)).data;
};
