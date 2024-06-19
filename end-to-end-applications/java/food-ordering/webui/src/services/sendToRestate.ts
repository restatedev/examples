import axios from 'axios';

const RESTATE_HOST =
  process.env.REACT_APP_RESTATE_HOST || 'http://localhost:8080';
const KAFKA_REST_PROXY_HOST = 'http://localhost:8088';


export async function createOrder(orderId: string, order: any) {
  return await (
    await axios.post(
      `${RESTATE_HOST}/OrderWorkflow/create/send`,
      order,
      {
        headers: {
          'content-type': 'application/json',
          'idempotency-key': orderId
        },
      }
    )
  ).data;
}

export async function getStatus(orderId: string) {
  return await (
    await axios.get(`${RESTATE_HOST}/OrderStatusService/${orderId}/get`, {})
  ).data;
}

export const publishToKafka = async (record: any) => {
  return await (
    await axios.post(
      `${KAFKA_REST_PROXY_HOST}/topics/orders`,
      `{"records":[${record}]}`,
      {
        headers: {
          'Content-Type': 'application/vnd.kafka.json.v2+json',
          Accept: '*/*',
        },
      }
    )
  ).data;
};
