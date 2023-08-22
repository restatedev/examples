# These variables are defined in terraform.tfvars, otherwise the defaults are used.

variable "name" {
  description = "the name of the demo stack"
}

variable "availability_zones" {
  description = "a list of availability zones"
}

variable "cidr" {
  description = "The CIDR block for the VPC."
}

variable "public_subnets" {
  description = "a list of CIDRs for public subnets in your VPC, must be set if the cidr variable is defined, needs to have as many elements as there are availability zones"
}