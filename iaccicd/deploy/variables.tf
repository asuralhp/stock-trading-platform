variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "stplatform-eks"
}

variable "cluster_version" {
  description = "Kubernetes version for EKS"
  type        = string
  default     = "1.27"
}

variable "node_group_desired_capacity" {
  description = "Desired capacity for worker node group"
  type        = number
  default     = 2
}

variable "node_group_min" {
  description = "Minimum size for worker node group"
  type        = number
  default     = 1
}

variable "node_group_max" {
  description = "Maximum size for worker node group"
  type        = number
  default     = 3
}

variable "instance_type" {
  description = "Instance type for worker nodes"
  type        = string
  default     = "t3.medium"
}
