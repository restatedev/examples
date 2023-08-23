# These variables are defined in terraform.tfvars, otherwise the defaults are used.
variable "name" {
  description = "the name of the demo stack"
}

variable "region" {
  description = "the AWS region"
  default     = "eu-central-1"
}

variable "aws-region" {
  type        = string
  description = "AWS region to launch the cluster"
  default     = "eu-central-1"
}

variable "availability_zones" {
  description = "a list of availability zones"
  default     = ["eu-central-1a", "eu-central-1b"]
}

variable "cidr" {
  description = "The CIDR block for the VPC."
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "a list of CIDRs for public subnets in your VPC, must be set if the cidr variable is defined, needs to have as many elements as there are availability zones"
  default     = ["10.0.16.0/20", "10.0.48.0/20"]
}

variable "service_desired_count" {
  description = "Number of tasks running in parallel"
  default     = 1
}

variable "restate_runtime_ingress_port" {
  description = "The port of the restate runtime ingress endpoint"
  default     = 9090
}

variable "restate_runtime_discovery_port" {
  description = "The port of the restate runtime to register service endpoints"
  default     = 8081
}

variable "webapp_port" {
  description = "The port where the shopping service webapp is exposed"
  default     = 3000
}

variable "jaeger_ui_port" {
  description = "The port where the Jaeger UI is exposed"
  default     = 16686
}

variable "jaeger_tracing_port" {
  description = "The port where Jaeger tracing is exposed"
  default     = 4317
}

variable "pgadmin_ui_port" {
  description = "The port where the pgadmin UI is exposed"
  default     = 5050
}

variable "ecr_uri" {
  description = "ECR repository URI where the demo images are uploaded"
}

variable "shopping_service_grpc_port" {
  description = "The port of the shopping services gRPC endpoint"
  default     = 8080
}

variable "webapp_image" {
  description = "Webapp container image ECR repository URL"
}

variable "restate_runtime_image" {
  description = "Restate runtime container image ECR repository URL"
}

variable "shopping_services_image" {
  description = "Shopping services container image ECR repository URL"
}

variable "jaeger_image" {
  description = "Jaeger container image ECR repository URL"
}

variable "pgadmin_image" {
  description = "Pgadmin container image ECR repository URL"
}