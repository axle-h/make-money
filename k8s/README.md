# Kubernetes Deployment

I use k3s. This might not work otherwise.

```shell
kubectl create namespace make-money
kubectl -n make-money apply -f *
```

TODO address this
`Warning: annotation "kubernetes.io/ingress.class" is deprecated, please use 'spec.ingressClassName' instead`