# CI/CD: Terraform EKS + GitHub Actions

## minikube for poc

```
winget install Kubernetes.minikube

kubectl logs deployment.apps/webapp -n webapp
kubectl apply -f webapp.yaml
minikube image load webapp:latest --overwrite
```


This folder contains a minimal Terraform configuration to create an AWS EKS cluster
and a GitHub Actions workflow that builds Docker images for the service folders
(`webapp`, `docapp`, `agent`, `vecdb`, `exdata`), pushes them to Docker Hub,
and updates Kubernetes Deployments in the EKS cluster to use the new image.

Files added
- `terraform/` - Terraform configuration for VPC + EKS with a managed node group.
- `.github/workflows/push-and-deploy.yml` - GitHub Actions workflow (trigger: push to `main` for tracked folders).

Required GitHub secrets
- `DOCKERHUB_USERNAME` - Docker Hub username.
- `DOCKERHUB_TOKEN` - Docker Hub access token (used as password).
- `AWS_ACCESS_KEY_ID` - AWS credentials with permissions to manage EKS and update kubeconfig.
- `AWS_SECRET_ACCESS_KEY` - AWS secret for the above key.
- `AWS_REGION` - AWS region (e.g. `us-east-1`).
- `EKS_CLUSTER_NAME` - Name of the EKS cluster created by Terraform (or pre-existing cluster).

Notes and assumptions
- The workflow assumes your Kubernetes Deployment names match the folder names
  (e.g., `deployment/webapp` with container `webapp`). Adjust the workflow if
  your deployment names or container names are different.
- Terraform modules used:
  - `terraform-aws-modules/vpc/aws`
  - `terraform-aws-modules/eks/aws`
  Run `terraform init` in `iaccicd/terraform` before `plan`/`apply`.
- The workflow logs into Docker Hub, builds multi-tag images (latest and commit SHA),
  pushes them, then updates the matching K8s deployment image and waits for rollout.

Next steps / suggestions
- Replace the simple `kubectl set image` with a Helm upgrade or a `kustomize`/GitOps flow
  for more robust releases and rollout strategies.
- Add IAM role and OIDC provider for the GitHub Actions runner to use short-lived
  credentials (recommended instead of long-lived AWS keys).
