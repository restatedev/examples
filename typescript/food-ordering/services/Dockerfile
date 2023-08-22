FROM node:18-alpine

# dumb-init helps handling SIGTERM and SIGINT correctly
RUN apk add dumb-init

WORKDIR /usr/src/app

# copy package.json and package-lock.json separately to cache dependencies
COPY package*.json .
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install

COPY --chown=node:node .. .

RUN npm run proto
RUN npm run build

RUN npm prune --production
ENV NODE_ENV production

EXPOSE 8080
USER node
CMD ["dumb-init", "node", "./dist/app.js"]
