# Webapp on Minikube with HPA

```
minikube start
minikube addons enable metrics-server
minikube image load webapp-webapp:latest

# prepare env config
cp kube/.env.example kube/.env  # edit values
kubectl create configmap webapp-env --from-env-file=kube/.env --namespace webapp

# deploy
kubectl apply -f kube/webapp.yaml

# load & watch
kubectl apply -f kube/webapp-loadtest.yaml
kubectl get hpa -n webapp -w
kubectl top pods -n webapp

kubectl port-forward deploy/webapp -n webapp 27017:27017
minikube image load webapp-webapp:latest --overwrite
kubectl rollout restart deployment/webapp -n webapp
```


This folder contains manifests to run the Next.js `webapp` on Minikube with CPU-based autoscaling and a simple load generator.

## Files
- `webapp.yaml`: namespace + deployment + NodePort service + HorizontalPodAutoscaler.
- `webapp-loadtest.yaml`: short-lived Job that drives HTTP traffic using `rakyll/hey`.

## Prerequisites
- Minikube running and `kubectl` pointing at it.
- Metrics Server enabled (required for HPA):
  ```powershell
  minikube addons enable metrics-server
  ```
- The image `webapp-webapp:latest` available to the cluster. From Docker Desktop build, load it into Minikube:
  ```powershell
  minikube image load webapp-webapp:latest
  ```
  (If you have a registry image, change the `image:` field in `webapp.yaml` instead.)

## Deploy
```powershell
kubectl apply -f kube/webapp.yaml
```
Check resources:
```powershell
kubectl get deploy,svc,hpa -n webapp
minikube service webapp -n webapp --url
```

## Generate Load to Trigger Autoscaling
Apply the load generator Job (runs ~2 minutes by default):
```powershell
kubectl apply -f kube/webapp-loadtest.yaml
kubectl logs job/webapp-loadtest -n webapp -f
```
Watch scaling while load runs:
```powershell
kubectl get hpa -n webapp -w
# In another window
kubectl get pods -n webapp -w
kubectl top pods -n webapp
```
The HPA is set to 70% CPU utilization with minReplicas=1 and maxReplicas=5. Increase/decrease `args` in `webapp-loadtest.yaml` or adjust `resources` in `webapp.yaml` if you need more/less pressure to reach the target.

## Cleanup
```powershell
kubectl delete -f kube/webapp-loadtest.yaml
kubectl delete -f kube/webapp.yaml
```
