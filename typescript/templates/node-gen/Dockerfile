FROM node:24-alpine AS build

RUN npm install -g pnpm@12.8.1

WORKDIR /usr/src/app

# copy package.json separately to cache dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .
RUN pnpm build

RUN pnpm prune --prod

FROM node:24-alpine

# dumb-init helps handling SIGTERM and SIGINT correctly
RUN apk add dumb-init

WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY --from=build --chown=node:node /usr/src/app/package.json ./
COPY --from=build --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/dist ./dist

EXPOSE 9080
USER node
CMD ["dumb-init", "node", "./dist/app.js"]
