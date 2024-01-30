import express, { Request, Response } from "express";
import axios from "axios";
import axiosRetry from 'axios-retry';

axiosRetry(axios, { retries: Infinity });

const RESTATE_RUNTIME_ENDPOINT =
    process.env.RESTATE_RUNTIME_ENDPOINT || "http://localhost:8080";
const RESTATE_TOKEN = process.env.RESTATE_RUNTIME_TOKEN;

type GenerateStableDiffusionParams = { prompt: string, steps?: number }
type TransformStableDiffusionParams = { prompt: string, init_images: string[], steps?: number }

const app = express();
const port = 5050;
app.use(express.json({ limit: '200mb' }));

app.post("/generate", async (req: Request, res: Response) => {
    res.sendStatus(200);

    const result = await generateImage(req.body.params)
    await resolveCallback(req.body.callback, result);
});

app.post("/transform", async (req: Request, res: Response) => {
    res.sendStatus(200);

    const result = await transformImage(req.body.params)
    await resolveCallback(req.body.callback, result);
});

async function generateImage(params: GenerateStableDiffusionParams) {
    console.info(`${logPrefix()} Generate image for ${JSON.stringify(params, (k, v) => k === "init_images" ? undefined : v)}`);
    const response = await axios.post("http://127.0.0.1:7860/sdapi/v1/txt2img", params)
    return response.data.images[0];
}

async function transformImage(params: TransformStableDiffusionParams) {
    console.info(`${logPrefix()} Transform image for ${JSON.stringify(params)}`);
    const response = await axios.post("http://127.0.0.1:7860/sdapi/v1/img2img", params)
    return response.data.images[0];
}

async function resolveCallback(cb: string, payload?: string) {
    console.info(`${logPrefix()} Resolve callback ${cb}`);

    await axios.post(
        `${RESTATE_RUNTIME_ENDPOINT}/dev.restate.Awakeables/Resolve`,
        { id: cb, json_result: payload ?? {} },
        {
            headers: {
                "Content-Type": "application/json",
                ...(RESTATE_TOKEN && { Authorization: `Bearer ${RESTATE_TOKEN}` }),
            },
        }
    );
}

function logPrefix() {
    return `[sd] [${new Date().toISOString()}] INFO:`;
}

app.listen(port, () => {
    console.log(`${logPrefix()}  Stable diffusion external service is listening on port ${port}`);
});