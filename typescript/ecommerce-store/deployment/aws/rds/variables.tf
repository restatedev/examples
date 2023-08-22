variable "name" {
  description = "the name of the stack, e.g. \"shopping-cart-demo\""
}

variable "vpc_id" {
  description = "The VPC ID"
}

variable "region" {
  description = "the AWS region in which resources are created"
}

variable "db_subnet_group_name" {
  description = "Subnet group name for the RDS database"
}

variable "ecs_service_security_groups" {
  description = "Comma separated list of security groups"
}