# Security groups
data "http" "ip" {
  url = "https://ifconfig.me/ip"
}

resource "aws_security_group" "ecs_tasks" {
  name   = "${var.name}-sg-task"
  vpc_id = var.vpc_id

  ingress {
    protocol  = -1
    self      = true # services within the same security group can connect
    from_port = 0
    to_port   = 0
  }

  ingress {
    protocol         = "tcp"
    from_port        = 22
    to_port          = 22
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  // Our IP needs to be able to access the RDS database endpoint because we need to be able to run the init script.
  ingress {
    protocol    = "tcp"
    from_port   = 5432
    to_port     = 5432
    cidr_blocks = ["${data.http.ip.response_body}/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.name}-sg-task"
  }
}

output "ecs_tasks" {
  value = aws_security_group.ecs_tasks.id
}