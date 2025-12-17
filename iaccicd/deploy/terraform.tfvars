# Example terraform.tfvars for iaccicd/deploy
# Copy this file to `terraform.tfvars` and adjust values before running `terraform apply`.

region = "us-east-1"

# EKS cluster settings
cluster_name = "stplatform-eks"
cluster_version = "1.27"

# Node group sizing
node_group_desired_capacity = 2
node_group_min = 1
node_group_max = 3

# EC2 instance type for worker nodes
instance_type = "t3.medium"
