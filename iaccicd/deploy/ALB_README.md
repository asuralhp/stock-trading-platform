AWS ALB (Application Load Balancer) integration notes

This folder contains an example `Ingress` manifest (`k8s/ingress-example.yaml`) that
will create an Application Load Balancer when the AWS Load Balancer Controller is
installed into the EKS cluster.

Quick steps to enable ALB for Kubernetes workloads

1. Ensure the EKS cluster has an OIDC provider enabled (needed for IRSA). The
   `terraform-aws-modules/eks` module can create the OIDC provider; verify your
   `module.eks` settings or create it manually.

2. Create an IAM policy for the AWS Load Balancer Controller and an IAM role
   that the controller will assume via IRSA. The official AWS docs provide the
   policy JSON. Example (high-level):

   - Create IAM OIDC provider using the cluster issuer URL.
   - Create IAM role with trust relationship for the service account `aws-load-balancer-controller`.
   - Attach the managed policy to the role.

3. Install the AWS Load Balancer Controller via Helm using the IRSA role. Example:

   ```bash
   # add helm repo
   helm repo add eks https://aws.github.io/eks-charts
   helm repo update

   # install (replace placeholders)
   helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
     -n kube-system \
     --set clusterName=${EKS_CLUSTER_NAME} \
     --set serviceAccount.create=false \
     --set serviceAccount.name=aws-load-balancer-controller \
     --set region=${AWS_REGION}
   ```

4. Apply the example `Ingress` (`k8s/ingress-example.yaml`). The controller will
   create an ALB and register pod IPs as targets.

References
- https://kubernetes-sigs.github.io/aws-load-balancer-controller/
- https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html
