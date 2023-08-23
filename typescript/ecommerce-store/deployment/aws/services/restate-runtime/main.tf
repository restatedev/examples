# Restate runtime
resource "aws_cloudwatch_log_group" "restate_runtime" {
  name = "/ecs/${var.name}-restate-runtime-task"

  tags = {
    Name = "${var.name}-restate-runtime-task"
  }
}

resource "aws_service_discovery_service" "restate_runtime" {
  name = "restate-runtime"

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

resource "aws_ecs_task_definition" "restate_runtime" {
  family                   = "${var.name}-restate-runtime-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  container_definitions    = jsonencode([
    {
      name        = "${var.name}-restate-runtime-container"
      image       = var.restate_runtime_image
      essential   = true
      environment = [
        {
          name  = "RUST_LOG",
          value = "info,restate=debug"
        },
        {
          name  = "RUST_BACKTRACE",
          value = "full"
        },
        {
          name  = "RUST_BACKTRACE",
          value = "full"
        },
        {
          name  = "RESTATE_OBSERVABILITY__TRACING__ENDPOINT",
          value = "http://${var.jaeger_service_discovery_name}.${var.service_discovery_dns_name}:${var.jaeger_tracing_port}"
        }
      ]
      portMappings = [
        {
          protocol      = "tcp"
          containerPort = var.restate_runtime_ingress_port
          hostPort      = var.restate_runtime_ingress_port
        },
        {
          protocol      = "tcp"
          containerPort = var.restate_runtime_discovery_port
          hostPort      = var.restate_runtime_discovery_port
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options   = {
          awslogs-group         = aws_cloudwatch_log_group.restate_runtime.name
          awslogs-stream-prefix = "ecs"
          awslogs-region        = var.region
        }
      }
    }
  ])

  tags = {
    Name = "${var.name}-restate-runtime-task"
  }
}

resource "aws_ecs_service" "restate-runtime" {
  name                               = "restate-runtime"
  cluster                            = var.aws_ecs_cluster_id
  task_definition                    = aws_ecs_task_definition.restate_runtime.arn
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
    registry_arn = aws_service_discovery_service.restate_runtime.arn
  }
}

output "restate_runtime_service_discovery_name" {
  value = aws_service_discovery_service.restate_runtime.name
}
