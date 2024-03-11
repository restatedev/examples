/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Buffer } from 'node:buffer';
import * as restate from '@restatedev/restate-sdk';

export default {
	async fetch(request: Request, env: {}, ctx: ExecutionContext): Promise<Response> {
		const result = await handler({
			path: new URL(request.url).pathname,
			body: Buffer.from(await request.arrayBuffer()).toString('base64'),
		});
		return new Response(Buffer.from(result.body, 'base64'), {
			headers: result.headers,
			status: result.statusCode,
		});
	},
};

const router = restate.keyedRouter({
	greet: async (ctx: restate.RpcContext, name: string) => {
		return `Hello ${name} :-)`;
	},
	greetAndRemember: async (ctx: restate.RpcContext, name: string) => {
		let seen = (await ctx.get<number>('seen')) ?? 0;
		seen += 1;

		ctx.set('seen', seen);
		return `Hello ${name} for the #${seen} time :-)`;
	},
});

const handler = restate.createLambdaApiGatewayHandler().bindKeyedRouter('Greeter', router).handle();
