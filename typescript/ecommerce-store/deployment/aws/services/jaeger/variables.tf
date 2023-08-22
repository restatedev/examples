variable "name" {
  description = "the name of the demo stack"
}

variable "aws_ecs_cluster_id" {
  description = "The id of the ECS cluster"
}

variable "region" {
  description = "the AWS region in which resources are created"
}

variable "subnets" {
  description = "List of subnet IDs"
}

variable "ecs_service_security_groups" {
  description = "Comma separated list of security groups"
}

variable "ecs_task_role_arn" {
  description = "ECS task role arn"
}

variable "ecs_task_execution_role_arn" {
  description = "ECS task execution role arn"
}

variable "service_discovery_dns_id" {
  description = "Service discovery DNS ID"
}

variable "service_desired_count" {
  description = "Number of services running in parallel"
}

variable "jaeger_ui_port" {
  description = "Jaeger UI port"
}

variable "jaeger_tracing_port" {
  description = "Jaeger tracing port"
}

variable "jaeger_image" {
  description = "Jaeger container image ECR repository URL"
}