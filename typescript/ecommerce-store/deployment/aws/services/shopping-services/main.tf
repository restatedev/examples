# Shopping services
resource "aws_cloudwatch_log_group" "shopping_services" {
  name = "/ecs/${var.name}-shopping-services-task"

  tags = {
    Name = "${var.name}-shopping-services-task"
  }
}

resource "aws_service_discovery_service" "shopping_services" {
  name = "shopping-services"

  dns_config {
    namespace_id = var.service_discovery_dns_id

    dns_records {
      ttl  = 60
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_ecs_task_definition" "shopping_services" {
  family                   = "${var.name}-shopping-services-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  container_definitions    = jsonencode([
    {
      name        = "${var.name}-shopping-services-container"
      image       = var.shopping_services_image
      essential   = true
      environment = [
        {
          name  = "OTEL_EXPORTER_JAEGER_ENDPOINT",
          value = "http://${var.jaeger_service_discovery_name}.${var.service_discovery_dns_name}:14250"
        },
        {
          name  = "OTEL_METRICS_EXPORTER",
          value = "none"
        },
        {
          name  = "OTEL_RESOURCE_ATTRIBUTES",
          value = "service.namespace=shopping-cart"
        },
        {
          name  = "OTEL_SERVICE_NAME",
          value = "shopping-services"
        },
        {
          name  = "OTEL_TRACES_EXPORTER",
          value = "jaeger"
        },
        {
          name  = "OTEL_TRACES_SAMPLER",
          value = "always_on"
        },
        {
          name  = "DATABASE_ENABLED",
          value = "true"
        },
        {
          name  = "DB_HOSTNAME",
          value = var.db_address
        }
      ]
      portMappings = [
        {
          protocol      = "tcp"
          containerPort = var.shopping_services_grpc_port
          hostPort      = var.shopping_services_grpc_port
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options   = {
          awslogs-group         = aws_cloudwatch_log_group.shopping_services.name
          awslogs-stream-prefix = "ecs"
          awslogs-region        = var.region
        }
      }
    }
  ])

  tags = {
    Name = "${var.name}-shopping-services-task"
  }
}

resource "aws_ecs_service" "shopping_services" {
  name                               = "shopping-services"
  cluster                            = var.aws_ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.shopping_services.arn
  desired_count                      = var.service_desired_count
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"
  scheduling_strategy                = "REPLICA"

  network_configuration {
    security_groups  = var.ecs_service_security_groups
    subnets          = var.subnets.*.id
    assign_public_ip = true
  }

  service_registries {
    registry_arn = aws_service_discovery_service.shopping_services.arn
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

output "services_discovery_name" {
  value = aws_service_discovery_service.shopping_services.name
}
