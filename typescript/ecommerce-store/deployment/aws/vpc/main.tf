# VPC creation

resource "aws_vpc" "main" {
  cidr_block           = var.cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.name}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name}-igw"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = element(var.public_subnets, count.index)
  availability_zone       = element(var.availability_zones, count.index)
  count                   = length(var.public_subnets)
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.name}-public-subnet-${format("%03d", count.index+1)}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name}-routing-table-public"
  }
}

resource "aws_route" "public" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  count          = length(var.public_subnets)
  subnet_id      = element(aws_subnet.public.*.id, count.index)
  route_table_id = aws_route_table.public.id
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.name}-db-subnet-group"
  subnet_ids = aws_subnet.public.*.id
  tags       = {
    Name = "${var.name}-db-subnet-group"
  }
}

resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "shopping-cart-demo"
  description = "Shopping demo private DNS for inter-service communication"
  vpc         = aws_vpc.main.id
}

output "id" {
  value = aws_vpc.main.id
}

output "public_subnets" {
  value = aws_subnet.public
}

output "db_subnet_group_name" {
  value = aws_db_subnet_group.main.name
}

output "service_discovery_dns_id" {
  value = aws_service_discovery_private_dns_namespace.main.id
}

output "service_discovery_dns_name" {
  value = aws_service_discovery_private_dns_namespace.main.name
}