terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    terraform_vpc = {
      source  = "terraform-aws-modules/vpc/aws"
      version = "~> 4.0"
    }
    terraform_eks = {
      source  = "terraform-aws-modules/eks/aws"
      version = "~> 20.0"
    }
  }
}

provider "aws" {
  region = var.region
}
