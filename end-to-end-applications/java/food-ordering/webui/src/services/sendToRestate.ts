import axios from 'axios';

const RESTATE_HOST =
  process.env.REACT_APP_RESTATE_HOST || 'http://localhost:8080';
const KAFKA_REST_PROXY_HOST = 'http://localhost:8088';

const challenge = (): {challenge: string, challengeTime: string} => {
  const challengeTime = new Date().getTime();
  const challenge = challengeTime ^ 7925119523126
  return {challenge: challenge.toString(), challengeTime: challengeTime.toString()}
}

export const sendRequestToRestate = async (
  service: string,
  method: string,
  data: any
) => {
  const c = challenge();

  return await (
    await axios.post(`${RESTATE_HOST}/${service}/${method}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Challenge': c.challenge,
        'X-Challenge-Time': c.challengeTime,
      },
    })
  ).data;
};

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
