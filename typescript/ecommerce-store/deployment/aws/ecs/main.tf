# ECS cluster + Fargate

resource "aws_ecs_cluster" "main" {
  name = "${var.name}-ecs-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.name}-ecs-cluster"
  }
}

resource "aws_iam_role" "ecs_shopping" {
  name               = "ecs_shopping"
  assume_role_policy = <<EOF
{
"Version": "2012-10-17",
"Statement": [
  {
    "Effect": "Allow",
    "Principal": {
      "Service": "ec2.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
  }
]
}
EOF
}

resource "aws_iam_role_policy" "ecs_shopping" {
  name   = "ecs_instance_role"
  role   = aws_iam_role.ecs_shopping.id
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:CreateCluster",
        "ecs:DeregisterContainerInstance",
        "ecs:DiscoverPollEndpoint",
        "ecs:Poll",
        "ecs:RegisterContainerInstance",
        "ecs:StartTelemetrySession",
        "ecs:Submit*",
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecs:StartTask"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_instance_profile" "ecs_shopping" {
  name = "ecs_shopping_iam_profile"
  role = "ecsInstanceRole"
}

# SSH KEY GENERATION

resource "tls_private_key" "shopping_private_key" {
  algorithm = "RSA"
  rsa_bits  = 4096

  # write the private key to a file to be able to use this later for ssh'ing into the instance
  provisioner "local-exec" {
    command = "rm -f shopping-demo-key.pem && echo '${self.private_key_pem}' > shopping-demo-key.pem"
  }
}

resource "aws_key_pair" "shopping_key_pair" {
  key_name   = "shopping_key"
  public_key = tls_private_key.shopping_private_key.public_key_openssh
}


resource "aws_instance" "ec2_instance" {
  ami                    = "ami-0319b5b60d7feac49"
  subnet_id              = var.subnets.0.id
  instance_type          = "m6i.large"
  user_data              = <<EOF
#!/bin/bash
echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
EOF
  iam_instance_profile   = aws_iam_instance_profile.ecs_shopping.name
  vpc_security_group_ids = var.ecs_service_security_groups
  key_name               = aws_key_pair.shopping_key_pair.key_name

  # write the public DNS to a file to be able to use this later for ssh'ing into the instance
  provisioner "local-exec" {
    command = "rm -f aws_ec2_instance_public_dns.txt && echo '${self.public_dns}' > aws_ec2_instance_public_dns.txt"
  }
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.name}-ecsTaskExecutionRole"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.name}-ecsTaskRole"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "ecs-task-execution-role-policy-attachment" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

output "aws_ecs_cluster_id" {
  value = aws_ecs_cluster.main.id
}

output "aws_ec2_instance_public_dns" {
  value = aws_instance.ec2_instance.public_dns
}

output "ecs_task_role_arn" {
  value = aws_iam_role.ecs_task_role.arn
}

output "ecs_task_execution_role_arn" {
  value = aws_iam_role.ecs_task_execution_role.arn
}
