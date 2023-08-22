# Creates an RDS products database for the ProductService and ProductManagerService
resource "aws_db_instance" "products_rds" {
  identifier             = "${var.name}-rds"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "14.5"
  db_name                = "productsdb"
  username               = "restatedb"
  password               = "restatedb"
  multi_az               = false
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = var.ecs_service_security_groups
  publicly_accessible    = true
  skip_final_snapshot    = true
}

resource "null_resource" "init_db" {
  depends_on = [aws_db_instance.products_rds] #wait for the db to be ready
  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    working_dir = "/tmp"
    command     = <<-EOT
          #!/bin/bash
#          sudo apt update -y
#          sudo apt install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-6-x86_64/pgdg-redhat-repo-latest.noarch.rpm
#          sudo apt install postgresql -y
          export PGPASSWORD=${aws_db_instance.products_rds.password}
          psql --host=${aws_db_instance.products_rds.address} --port=5432 --username=${aws_db_instance.products_rds.username} --dbname=${aws_db_instance.products_rds.db_name} < ${path.cwd}/rds/init.sql
      EOT
  }
}

output "db_address" {
  value = aws_db_instance.products_rds.address
}