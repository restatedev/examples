# Pgadmin
resource "aws_cloudwatch_log_group" "pgadmin" {
  name = "/ecs/${var.name}-pgadmin-task"

  tags = {
    Name = "${var.name}-pgadmin-task"
  }
}

resource "aws_service_discovery_service" "pgadmin" {
  name = "pgadmin"

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

resource "aws_ecs_task_definition" "pgadmin" {
  family                   = "${var.name}-pgadmin-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  container_definitions    = jsonencode([
    {
      name        = "${var.name}-pgadmin-container"
      image       = var.pgadmin_image
      essential   = true
      environment = [
        {
          name  = "PGADMIN_DEFAULT_EMAIL",
          value = "admin@restate.dev"
        },
        {
          name  = "PGADMIN_DEFAULT_PASSWORD",
          value = "admin"
        },
        {
          name  = "PGADMIN_LISTEN_PORT",
          value = "5050"
        }
      ]
      portMappings = [
        {
          protocol      = "tcp"
          containerPort = var.pgadmin_ui_port
          hostPort      = var.pgadmin_ui_port
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options   = {
          awslogs-group         = aws_cloudwatch_log_group.pgadmin.name
          awslogs-stream-prefix = "ecs"
          awslogs-region        = var.region
        }
      }
    }
  ])

  tags = {
    Name = "${var.name}-pgadmin-task"
  }
}

resource "aws_ecs_service" "pgadmin" {
  name                               = "pgadmin"
  cluster                            = var.aws_ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.pgadmin.arn
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
    registry_arn = aws_service_discovery_service.pgadmin.arn
  }
}