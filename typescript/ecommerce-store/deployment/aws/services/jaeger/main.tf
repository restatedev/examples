# Jaeger
resource "aws_cloudwatch_log_group" "jaeger" {
  name = "/ecs/${var.name}-jaeger-task"

  tags = {
    Name = "${var.name}-jaeger-task"
  }
}

resource "aws_service_discovery_service" "jaeger" {
  name = "jaeger"

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

resource "aws_ecs_task_definition" "jaeger" {
  family                   = "${var.name}-jaeger-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  container_definitions    = jsonencode([
    {
      name         = "${var.name}-jaeger-container"
      image        = var.jaeger_image
      essential    = true
      portMappings = [
        {
          protocol      = "tcp"
          containerPort = var.jaeger_ui_port
          hostPort      = var.jaeger_ui_port
        },
        {
          protocol      = "tcp"
          containerPort = var.jaeger_tracing_port
          hostPort      = var.jaeger_tracing_port
        },
        {
          protocol      = "tcp"
          containerPort = 14250
          hostPort      = 14250
        },
        {
          protocol      = "tcp"
          containerPort = 14269
          hostPort      = 14269
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options   = {
          awslogs-group         = aws_cloudwatch_log_group.jaeger.name
          awslogs-stream-prefix = "ecs"
          awslogs-region        = var.region
        }
      }
    }
  ])

  tags = {
    Name = "${var.name}-jaeger-task"
  }
}

resource "aws_ecs_service" "jaeger" {
  name                               = "jaeger"
  cluster                            = var.aws_ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.jaeger.arn
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
    registry_arn = aws_service_discovery_service.jaeger.arn
  }
}

output "jaeger_service_discovery_name" {
  value = aws_service_discovery_service.jaeger.name
}