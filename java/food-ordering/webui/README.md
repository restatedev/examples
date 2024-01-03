# Shopping cart application

A React application that implements a webshop. This is implemented as a Jamstack front-end,
so requests go straight from the browser to Restate (via API gateway or reversed proxy).

## Requirements

- Node.js
- NPM

## Running locally

First, Install the needed packages

```shell
npm install
```

Then start the React app with:

```shell
npm start
```

## Building the Docker image

You can build a Docker image by executing:

```shell
docker build -t dev.local/shopping-cart/react-app:0.0.1 .
```

## Running on Vercel

If you have the Vercel CLI installed and are logged in. You can deploy the app by executing:

```shell
vercel
```

And following the prompted instructions.

## Attribution

We based this implementation on the MIT Licensed repository here: https://github.com/jeffersonRibeiro/react-shopping-cart.
