variable "name" {
  description = "name of the demo stack"
}

variable "vpc_id" {
  description = "The VPC ID"
}

variable "restate_runtime_ingress_port" {
  description = "Restate runtime gRPC port"
}

variable "webapp_port" {
  description = "Webapp UI port"
}

variable "jaeger_ui_port" {
  description = "Jaeger UI port"
}

variable "jaeger_tracing_port" {
  description = "Jaeger tracing port"
}

variable "shopping_service_grpc_port" {
  description = "Shopping services gRPC port"
}