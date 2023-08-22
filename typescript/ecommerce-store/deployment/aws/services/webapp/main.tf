# Webapp
resource "aws_cloudwatch_log_group" "webapp" {
  name = "/ecs/${var.name}-webapp-task"

  tags = {
    Name = "${var.name}-webapp-task"
  }
}

resource "aws_service_discovery_service" "webapp" {
  name = "webapp"

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

resource "aws_ecs_task_definition" "webapp" {
  family                   = "${var.name}-webapp-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2", "FARGATE"]
  cpu                      = 512
  memory                   = 2048
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  container_definitions    = jsonencode([
    {
      name        = "${var.name}-webapp-container"
      image       = var.webapp_image
      essential   = true
      environment = [
        {
          name  = "REACT_APP_RESTATE_HOST",
          value = "http://localhost:9090"
        },
        {
          name  = "REACT_APP_DATABASE_ENABLED",
          value = "true"
        }
      ]
      portMappings = [
        {
          protocol      = "tcp"
          containerPort = var.webapp_port
          hostPort      = var.webapp_port
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options   = {
          awslogs-group         = aws_cloudwatch_log_group.webapp.name
          awslogs-stream-prefix = "ecs"
          awslogs-region        = var.region
        }
      }
    }
  ])

  tags = {
    Name = "${var.name}-webapp-task"
  }
}

resource "aws_ecs_service" "webapp" {
  name                               = "webapp"
  cluster                            = var.aws_ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.webapp.arn
  desired_count                      = var.service_desired_count
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  launch_type                        = "EC2"
  scheduling_strategy                = "REPLICA"

  network_configuration {
    security_groups  = var.ecs_service_security_groups
    subnets          = var.subnets.*.id
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.webapp.arn
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}
