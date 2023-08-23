# AWS ECS+Fargate deployment with Terraform

This directory contains Terraform configuration files to spin up the shopping cart demo on AWS ECS + Fargate.

The AWS architecture looks as follows:

<img src="../../img/aws_architecture.png" width=50% alt="">

## Prerequisites

- [Terraform CLI](https://learn.hashicorp.com/tutorials/terraform/install-cli?in=terraform/aws-get-started)
- AWS CLI
- Add your AWS account and credentials (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) to `~/.aws/config` and `~/.aws/credentials`.

## Pushing the Docker images to ECR

The following steps need to be executed the first time you want to run the app on Fargate.

Set your ECR repository URI as an environment variable and log in:

```shell
export ECR_REPOSITORY=<ecr-repository-uri>
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin $ECR_REPOSITORY
```

Build the following Docker images and push them to AWS ECR. At the root of the repository, do:

```shell
# Shopping services
docker build ./services -t $ECR_REPOSITORY/shopping-cart-demo:1.0.2 --secret id=npmrc,src=$HOME/.npmrc
docker push $ECR_REPOSITORY/shopping-cart-demo:1.0.2
# Shopping web app
docker build -t $ECR_REPOSITORY/shopping-cart-webapp:1.0.2 ./react-shopping-cart
docker push $ECR_REPOSITORY/shopping-cart-webapp:1.0.2
# Restate runtime
docker tag ghcr.io/restatedev/restate-dist:0.1.7 $ECR_REPOSITORY/restate-runtime:0.1.7
docker push $ECR_REPOSITORY/restate-runtime:0.1.7
# Jaeger
docker tag jaegertracing/all-in-one:1.37.0 $ECR_REPOSITORY/jaeger-all-in-one:1.37.0
docker push $ECR_REPOSITORY/jaeger-all-in-one:1.37.0
# pgAdmin
docker tag dpage/pgadmin4:6.15 $ECR_REPOSITORY/pgadmin:6.15
docker push $ECR_REPOSITORY/pgadmin:6.15
```

Rename the `terraform.tfvars.template` file to `terraform.tfvars`.
Then fill in the ECR repository URI under `ecr_repository_uri` in this file.
If you used different version tags, adapt those as well.

## Deploying on AWS ECS

Spin up the setup via:

```shell
terraform init
terraform apply
```

**After you have executed this command, you might need to wait a few minutes for all the services to be up.**

The ECS web UI shows you whether all services came up successfully.

When everything is running, the SSH key for the EC2 instances can be found under `shopping-demo-key.pem` and the public DNS of the EC2 instance can be found in `aws_ec2_instance_public_dns.txt`.

**(Temporary fix)**: It is possible that the services were not discovered correctly by the runtime. The
register-services ECS service might come up to early (needs to be fixed). In this case, you can let the runtime discover
the services by ssh'ing to the instance and executing the discovery curl command:

```shell
chmod 400 shopping-demo-key.pem
ssh -i shopping-demo-key.pem -L 5050:pgadmin.shopping-cart-demo:5050 -L 16686:jaeger.shopping-cart-demo:16686 -L 3000:webapp.shopping-cart-demo:3000 -L 9090:restate-runtime.shopping-cart-demo:9090 ec2-user@`cat aws_ec2_instance_public_dns.txt`
```

Then discover the services from within the ssh session:

```shell
curl -X POST http://restate-runtime.shopping-cart-demo:8081/endpoints -H 'content-type: application/json' -d '{"uri": "http://shopping-services.shopping-cart-demo:8080"}'
```

This prints out the services were discovered by the Restate runtime.

## Exposing the UIs

The ssh command of the previous paragraph also port forwarded the webapp UI, pgAdmin and Jaeger UI:

- Web app: http://localhost:3000
- Jaeger: http://localhost:16686
- pgAdmin: http://localhost:5050

To register the database in the pgAdmin UI, have a look at the [README at the root of the ecommerce example](../../README.md#demo-scenario-for-docker-compose-with-postgres).
and replace the `hostname/address` by the RDS database endpoint that you can retrieve
via:

```shell
aws rds describe-db-instances | jq '.DBInstances[0].Endpoint.Address'
```

## Cleanup

To destroy the setup:

```shell
terraform destroy
```
