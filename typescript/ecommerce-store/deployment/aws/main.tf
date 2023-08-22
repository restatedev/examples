terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  shared_config_files      = ["~/.aws/config"]
  shared_credentials_files = ["~/.aws/credentials"]
  profile                  = "default"
  region                   = var.aws-region
}

module "vpc" {
  source             = "./vpc"
  name               = var.name
  cidr               = var.cidr
  public_subnets     = var.public_subnets
  availability_zones = var.availability_zones
}

module "security_groups" {
  source                       = "./security-groups"
  name                         = var.name
  vpc_id                       = module.vpc.id
  restate_runtime_ingress_port = var.restate_runtime_ingress_port
  webapp_port                  = var.webapp_port
  jaeger_ui_port               = var.jaeger_ui_port
  jaeger_tracing_port          = var.jaeger_tracing_port
  shopping_service_grpc_port   = var.shopping_service_grpc_port
}

module "ecs" {
  source                      = "./ecs"
  name                        = var.name
  vpc_id                      = module.vpc.id
  region                      = var.aws-region
  subnets                     = module.vpc.public_subnets
  ecs_service_security_groups = [module.security_groups.ecs_tasks]
}

module "rds" {
  source                      = "./rds"
  name                        = var.name
  vpc_id                      = module.vpc.id
  region                      = var.aws-region
  db_subnet_group_name        = module.vpc.db_subnet_group_name
  ecs_service_security_groups = [module.security_groups.ecs_tasks]
}

module "jaeger" {
  source                      = "./services/jaeger"
  name                        = var.name
  aws_ecs_cluster_id          = module.ecs.aws_ecs_cluster_id
  region                      = var.aws-region
  subnets                     = module.vpc.public_subnets
  ecs_service_security_groups = [module.security_groups.ecs_tasks]
  ecs_task_role_arn           = module.ecs.ecs_task_role_arn
  ecs_task_execution_role_arn = module.ecs.ecs_task_execution_role_arn
  service_discovery_dns_id    = module.vpc.service_discovery_dns_id
  service_desired_count       = var.service_desired_count
  jaeger_ui_port              = var.jaeger_ui_port
  jaeger_tracing_port         = var.jaeger_tracing_port
  jaeger_image                = "${var.ecr_uri}/${var.jaeger_image}"
}

module "pgadmin" {
  source                      = "./services/pgadmin"
  name                        = var.name
  aws_ecs_cluster_id          = module.ecs.aws_ecs_cluster_id
  region                      = var.aws-region
  subnets                     = module.vpc.public_subnets
  ecs_service_security_groups = [module.security_groups.ecs_tasks]
  ecs_task_role_arn           = module.ecs.ecs_task_role_arn
  ecs_task_execution_role_arn = module.ecs.ecs_task_execution_role_arn
  service_discovery_dns_id    = module.vpc.service_discovery_dns_id
  service_desired_count       = var.service_desired_count
  pgadmin_ui_port             = var.pgadmin_ui_port
  pgadmin_image               = "${var.ecr_uri}/${var.pgadmin_image}"
}

module "shopping-services" {
  source                        = "./services/shopping-services"
  name                          = var.name
  aws_ecs_cluster_id            = module.ecs.aws_ecs_cluster_id
  region                        = var.aws-region
  subnets                       = module.vpc.public_subnets
  ecs_service_security_groups   = [module.security_groups.ecs_tasks]
  ecs_task_role_arn             = module.ecs.ecs_task_role_arn
  ecs_task_execution_role_arn   = module.ecs.ecs_task_execution_role_arn
  service_discovery_dns_id      = module.vpc.service_discovery_dns_id
  service_discovery_dns_name    = module.vpc.service_discovery_dns_name
  jaeger_service_discovery_name = module.jaeger.jaeger_service_discovery_name
  service_desired_count         = var.service_desired_count
  shopping_services_grpc_port   = var.shopping_service_grpc_port
  shopping_services_image       = "${var.ecr_uri}/${var.shopping_services_image}"
  db_address                    = module.rds.db_address
}

module "restate-runtime" {
  source                           = "./services/restate-runtime"
  name                             = var.name
  aws_ecs_cluster_id               = module.ecs.aws_ecs_cluster_id
  region                           = var.aws-region
  subnets                          = module.vpc.public_subnets
  ecs_service_security_groups      = [module.security_groups.ecs_tasks]
  ecs_task_role_arn                = module.ecs.ecs_task_role_arn
  ecs_task_execution_role_arn      = module.ecs.ecs_task_execution_role_arn
  service_discovery_dns_id         = module.vpc.service_discovery_dns_id
  service_discovery_dns_name       = module.vpc.service_discovery_dns_name
  shopping_services_discovery_name = module.shopping-services.services_discovery_name
  shopping_service_grpc_port       = var.shopping_service_grpc_port
  jaeger_service_discovery_name    = module.jaeger.jaeger_service_discovery_name
  service_desired_count            = var.service_desired_count
  restate_runtime_ingress_port     = var.restate_runtime_ingress_port
  restate_runtime_discovery_port   = var.restate_runtime_discovery_port
  restate_runtime_image            = "${var.ecr_uri}/${var.restate_runtime_image}"
  jaeger_tracing_port              = var.jaeger_tracing_port
}

module "webapp" {
  source                                 = "./services/webapp"
  name                                   = var.name
  aws_ecs_cluster_id                     = module.ecs.aws_ecs_cluster_id
  region                                 = var.aws-region
  subnets                                = module.vpc.public_subnets
  ecs_service_security_groups            = [module.security_groups.ecs_tasks]
  ecs_task_role_arn                      = module.ecs.ecs_task_role_arn
  ecs_task_execution_role_arn            = module.ecs.ecs_task_execution_role_arn
  service_discovery_dns_id               = module.vpc.service_discovery_dns_id
  service_discovery_dns_name             = module.vpc.service_discovery_dns_name
  restate_runtime_service_discovery_name = module.restate-runtime.restate_runtime_service_discovery_name
  service_desired_count                  = var.service_desired_count
  restate_runtime_ingress_port           = var.restate_runtime_ingress_port
  webapp_port                            = var.webapp_port
  webapp_image                           = "${var.ecr_uri}/${var.webapp_image}"
}

# To open an ssh tunnel to the custer and port forward the demo UIs. This just prints it to the output which is practical to use afterwards.
output "aws_ec2_instance_public_dns" {
  value = module.ecs.aws_ec2_instance_public_dns
}