import axios from 'axios';
import {IOrderStatus} from "../models";

const RESTATE_HOST =
  process.env.REACT_APP_RESTATE_HOST || 'http://localhost:8080';
const KAFKA_REST_PROXY_HOST = 'http://localhost:8088';

const challenge = (): { challenge: string; challengeTime: string } => {
  const challengeTime = new Date().getTime();
  const challenge = challengeTime ^ 7925119523126;
  return {
    challenge: challenge.toString(),
    challengeTime: challengeTime.toString(),
  };
};

const challengeHeaders = () => {
  const c = challenge();

  return { 'X-Challenge': c.challenge, 'X-Challenge-Time': c.challengeTime };
};

export async function createOrder(orderId: string, order: any) {
  let res = await fetch(
    `${RESTATE_HOST}/order-workflow/${orderId}/run/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...challengeHeaders()
      },
      body: JSON.stringify(order),
    });
  if (!res.ok) {
    throw new Error(`Got status code ${res.status} with response body ${await res.text()}`);
  }

  console.log(`Sent the order request. Response: ${await res.text()}`)
}

export async function getStatus(orderId: string): Promise<IOrderStatus> {
  let status = await (
    await fetch(`${RESTATE_HOST}/order-workflow/${orderId}/getStatus`, { headers: challengeHeaders()})
  ).json();
  let eta = await (
    await fetch(`${RESTATE_HOST}/delivery/${orderId}/getETA`, { headers: challengeHeaders()})
  ).json();
  return { eta, status }
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
