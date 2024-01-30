# Kind + Knative deployment

This directory contains the Kubernetes manifest to spin up the shopping cart demo on a kind cluster with the services running as Knative services.

1. Make sure that you have a K8s environment with Knative installed.
   For example, follow [this guide](https://knative.dev/docs/getting-started/quickstart-install/) and launch the cluster via:

```shell
kn quickstart kind
```

2. Build the Docker images for the web application and backend services:

```shell
docker build -t dev.local/shopping-cart/react-app:0.0.1 ./react-shopping-cart
docker build ./services/ -t dev.local/shopping-cart/services:0.0.1
```

Upload the images to the cluster:

```shell
kind load docker-image --name knative dev.local/shopping-cart/services:0.0.1
kind load docker-image --name knative dev.local/shopping-cart/react-app:0.0.1
kind load docker-image --name knative docker.io/restatedev/restate:latest
```

3. Create the `shopping-cart` namespace

```shell
kubectl create ns shopping-cart
```

4. Deploy application

The `deploy.yaml` file lists the services that will be deployed on Kubernetes.
From the root of the `ecommerce-store` example, you can deploy them via:

```shell
kubectl apply -n shopping-cart -f deployment/knative/deploy.yaml
```

5. Forward local port `3000` to the web application pod

```shell
kubectl port-forward -n shopping-cart deployments/shopping-cart-webapp 3000:3000
```

You can visit the web app at http://localhost:3000

6. Forwards the ports of the Restate runtime:

```shell
kubectl port-forward -n shopping-cart svc/restate-runtime 8080:8080 9070:9070 9071:9071
```

7. Register the deployment in Restate:

```shell
curl localhost:9070/deployments -H 'content-type: application/json' -d '{"uri": "http://services.shopping-cart.svc.cluster.local"}'
```

8. Fill the state of the product service with a list of products:

```shell
cd deployment/local && ./init_state.sh "localhost:8080" && cd -
```

6. Watch pods of the application

```shell
watch kubectl get pods -n shopping-cart
```

Only the webapp and runtime will keep running. The other services run as knative apps and only get deployed when a request comes in.
If you order some T-shirts in the UI, you will see services spin up.

## Deleting the application

To delete the deployed application run:

```shell
kubectl delete -n shopping-cart -f deployment/knative/deploy.yaml
```

Then bring down the cluster via:

```shell
kind delete cluster --name knative
```
