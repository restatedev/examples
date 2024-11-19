import axios from 'axios';

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

export const sendRequestToRestate = async ({
  service,
  method,
  key,
  data,
  bg,
}: {
  service: string;
  method: string;
  data: any;
  key?: string;
  bg?: boolean;
}) => {
  const c = challenge();

  let url;
  if (key) {
    url = `${RESTATE_HOST}/${service}/${key}/${method}`;
  } else {
    url = `${RESTATE_HOST}/${service}/${method}`;
  }

  if (bg) {
    url = url + '/send';
  }

  return await (
    await axios.post(url, data, {
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
