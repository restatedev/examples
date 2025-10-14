# Tutorial: Restate and Knative

This tutorial shows how to set up Knative and Restate in a local Kubernetes cluster, 
to run the example shown in the [Knative Restate blog post](https://knative.dev/blog/articles/building-stateful-applications-with-knative-and-restate/).

Requirements:

* [`golang`](https://go.dev/doc/install)
* [`docker`](https://www.docker.com/) or [`podman`](https://podman.io/)
* [`kubectl`](https://kubernetes.io/docs/tasks/tools/)
* [`kind`](https://kind.sigs.k8s.io/docs/user/quick-start#installation)
* [`kn`](https://knative.dev/docs/client/install-kn/)
* [`kn-quickstart`](https://knative.dev/docs/install/quickstart-install/#install-the-knative-quickstart-plugin)
* [`ko`](https://ko.build/)
* [`helm`](https://helm.sh/docs/intro/quickstart/)
* [`restate` CLI](https://docs.restate.dev/quickstart)

## Set up the cluster

Set up the cluster using `kn quickstart`:

```shell
kn quickstart kind
```

And then set up the local registry using the provided script:

```shell
./install_registry.sh
```

The local registry will be used to push your application's image.

## Deploy Restate

To deploy Restate, apply the [Helm Chart](https://github.com/restatedev/restate/tree/main/charts/restate-helm):

```shell
helm install restate oci://ghcr.io/restatedev/restate-helm --namespace restate --create-namespace
```

The Helm chart setups a Restate instance in a `restate` namespace. It won't set up any `Ingress` though, so for the time being, in order to access Restate from the local machine, set up a port forwarding using `kubectl`:

```shell
kubectl port-forward -n restate svc/restate 9070:9070 8080:8080
```

Run:

```shell
restate whoami
```

And you should see at the bottom:

```shell
✅ Admin Service 'http://localhost:9070/' is healthy!
```

## Deploy the golang application

Build with `ko`:

```shell
KO_DOCKER_REPO=localhost:5001 ko build main.go -B
```

And then deploy it with `kn`:

```shell
kn service create example \
  --image localhost:5001/main.go \
  --port h2c:8080
```

Now, you can register `counter` to Restate using:

```shell
restate deployments register http://example.default.svc
```

You will be asked for confirmation:

```shell
❯ SERVICES THAT WILL BE ADDED:
  - User
    Type: VirtualObject ⬅️ 🚶🚶🚶
     HANDLER     INPUT                                     OUTPUT                                   
     Activate    none                                      none                                     
     Get         none                                      value of content-type 'application/json' 
     Initialize  value of content-type 'application/json'  none                                     

  - Signup
    Type: Service 
     HANDLER  INPUT                                     OUTPUT                                   
     Signup   value of content-type 'application/json'  value of content-type 'application/json'                                           


✔ Are you sure you want to apply those changes? · yes
```

Confirm it, and now you're ready to invoke your signup.

## Send requests

To send requests a signup request, just send an HTTP request to the signup service:

```shell
curl -v http://localhost:8080/Signup/Signup --json '{"username":"slinkydeveloper","name":"Francesco","surname":"Guardiani","password":"very-secret"}'
```

Now look into the logs of the running pod, you'll get the command to resolve the awakeable (simulating the email click):

```shell
kubectl logs -n default example-00001-deployment-<deployment_id>
```

The command should look like the following:

```shell
curl -v -X POST http://localhost:8080/restate/awakeables/<awakeable_id>/resolve
```

Now in the previous shell where you started the signup, you'll see the response:

```
The new user slinkydeveloper is signed up and activated
```

If you try to signup again re-executing the aforementioned signup request command, you'll get the following response:

```json
{
  "code": 500,
  "message": "[500] the user was already initialized"
}
```

## Next steps

To explore more, we suggest to take a look at our [documentation](https://docs.restate.dev/).
