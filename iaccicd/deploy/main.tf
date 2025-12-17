data "aws_availability_zones" "available" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "4.5.0"

  name = "${var.cluster_name}-vpc"
  cidr = "10.0.0.0/16"
  azs  = slice(data.aws_availability_zones.available.names, 0, 3)

  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

  enable_nat_gateway = true
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.0.0"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id   = module.vpc.vpc_id
  subnets  = module.vpc.private_subnets

  node_groups = {
    default = {
      desired_capacity = var.node_group_desired_capacity
      min_capacity     = var.node_group_min
      max_capacity     = var.node_group_max
      instance_types   = [var.instance_type]
    }
  }

  manage_aws_auth = true
}
