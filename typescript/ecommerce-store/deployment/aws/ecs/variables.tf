variable "name" {
  description = "the name of your stack, e.g. \"demo\""
}

variable "vpc_id" {
  description = "The VPC ID"
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