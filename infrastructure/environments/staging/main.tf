# HyRyder Staging Infrastructure (AWS ap-southeast-2 — Sydney)
# Configure AWS provider before applying:
#   export AWS_DEFAULT_REGION=ap-southeast-2

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "hyryder-terraform-state"
    key    = "staging/terraform.tfstate"
    region = "ap-southeast-2"
  }
}

provider "aws" {
  region = "ap-southeast-2"
  default_tags {
    tags = {
      Project     = "hyryder"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

# --- VPC ---------------------------------------------------------------
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  name    = "hyryder-staging"
  cidr    = "10.0.0.0/16"
  azs     = ["ap-southeast-2a", "ap-southeast-2b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  enable_nat_gateway = true
  single_nat_gateway = true
}

# --- RDS PostgreSQL + PostGIS -------------------------------------------
resource "aws_db_instance" "postgres" {
  identifier              = "hyryder-staging-postgres"
  engine                  = "postgres"
  engine_version          = "16.2"
  instance_class          = "db.t3.medium"
  allocated_storage       = 20
  storage_encrypted       = true
  db_name                 = "rideshare"
  username                = "rideshare"
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.default.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  skip_final_snapshot     = true
  backup_retention_period = 7
  parameter_group_name    = aws_db_parameter_group.postgres.name
}

resource "aws_db_parameter_group" "postgres" {
  family = "postgres16"
  name   = "hyryder-staging-postgres16"
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
}

resource "aws_db_subnet_group" "default" {
  name       = "hyryder-staging-rds"
  subnet_ids = module.vpc.private_subnets
}

# --- ElastiCache Redis --------------------------------------------------
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "hyryder-staging-redis"
  description                = "HyRyder staging Redis — cache, channels, celery"
  node_type                  = "cache.t3.micro"
  num_cache_clusters         = 1
  automatic_failover_enabled = false
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "hyryder-staging-redis"
  subnet_ids = module.vpc.private_subnets
}

# --- S3 Bucket ---------------------------------------------------------
resource "aws_s3_bucket" "documents" {
  bucket = "hyryder-staging-documents"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

# --- Security Groups ---------------------------------------------------
resource "aws_security_group" "rds" {
  name   = "hyryder-staging-rds"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
}

resource "aws_security_group" "redis" {
  name   = "hyryder-staging-redis"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
}

resource "aws_security_group" "ecs_tasks" {
  name   = "hyryder-staging-ecs"
  vpc_id = module.vpc.vpc_id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

variable "db_password" {
  type      = string
  sensitive = true
}
