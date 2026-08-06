# Kubernetes monitoring in SquaredUp

Monitor a [Kubernetes](https://kubernetes.io) cluster in SquaredUp — a live, auto-discovered service map of namespaces, nodes, workloads (deployments, replica sets, daemon sets, stateful sets, pods), networking (services, ingresses), storage (persistent volumes), and per-namespace resource guardrails (resource quotas, limit ranges), with cluster and resource health (no Prometheus dependency), live CPU/memory usage, and a live cluster events feed, via the [Kubernetes API](https://kubernetes.io/docs/reference/kubernetes-api/).

> ⚠️ CPU/memory usage tiles require [`metrics-server`](https://github.com/kubernetes-sigs/metrics-server) to be running in your cluster — this is Kubernetes' standard, lightweight Metrics API and is **not** Prometheus. Some managed clusters provide it by default (e.g. GKE); others, including EKS, do not. Run `kubectl top nodes` to check — if it fails with "Metrics API not available", install `metrics-server` to enable the CPU/memory usage tiles.

## Setup

You will need a **ServiceAccount bearer token** with read-only, cluster-wide access to core workload, networking, storage, and infrastructure objects.

1. Apply the following manifest to your cluster with `kubectl apply -f -`. The identity applying it needs `get`/`create`/`patch` on `ServiceAccount`, `ClusterRole`, and `ClusterRoleBinding` objects, and — per Kubernetes' RBAC self-escalation rules — must either already hold every permission listed in the `squaredup-reader` ClusterRole itself, or hold `escalate` on `clusterroles` and `bind` on this specific ClusterRole. `cluster-admin` satisfies this but isn't required; a role scoped to exactly these permissions works too:

    ```yaml
    apiVersion: v1
    kind: ServiceAccount
    metadata:
        name: squaredup-reader
        namespace: kube-system
    ---
    apiVersion: rbac.authorization.k8s.io/v1
    kind: ClusterRole
    metadata:
        name: squaredup-reader
    rules:
        - apiGroups: [""]
          resources:
              [
                  "nodes",
                  "namespaces",
                  "pods",
                  "services",
                  "events",
                  "persistentvolumes",
                  "persistentvolumeclaims",
                  "resourcequotas",
                  "limitranges",
              ]
          verbs: ["list", "get"]
        - apiGroups: ["apps"]
          resources:
              ["deployments", "replicasets", "daemonsets", "statefulsets"]
          verbs: ["list", "get"]
        - apiGroups: ["networking.k8s.io"]
          resources: ["ingresses"]
          verbs: ["list", "get"]
        - apiGroups: ["metrics.k8s.io"]
          resources: ["nodes", "pods"]
          verbs: ["list", "get"]
    ---
    apiVersion: rbac.authorization.k8s.io/v1
    kind: ClusterRoleBinding
    metadata:
        name: squaredup-reader
    roleRef:
        apiGroup: rbac.authorization.k8s.io
        kind: ClusterRole
        name: squaredup-reader
    subjects:
        - kind: ServiceAccount
          name: squaredup-reader
          namespace: kube-system
    ```

2. Generate a long-lived token for the ServiceAccount:

    ```shell
    kubectl create token squaredup-reader -n kube-system --duration=8760h
    ```

    On older clusters where [`TokenRequest`](https://kubernetes.io/docs/reference/kubernetes-api/authentication-resources/token-request-v1/) defaults to short-lived tokens, create a Secret-based token instead — see the [Kubernetes service account token docs](https://kubernetes.io/docs/concepts/security/service-accounts/#getting-a-token).

    **`--duration=8760h` is a request, not a guarantee** — the API server clamps it to its own configured maximum token lifetime, so the token may expire sooner. Plan to rotate it before then: re-run the command above to mint a new `TokenRequest` token and update the **Bearer Token** field, or, for a Secret-based token, delete the old Secret and create a new one.

    If the token is ever compromised, note that deleting the `ClusterRoleBinding` alone does **not** invalidate it — it only removes that binding's authorization, and the token remains valid for authentication (a different binding could still grant it access later). To actually invalidate the token: delete its Secret (Secret-based tokens), or delete and recreate the `squaredup-reader` ServiceAccount (`TokenRequest` tokens are bound to the ServiceAccount's identity, so recreating it invalidates previously issued tokens — allow for a short control-plane propagation delay). During containment, also remove every `ClusterRoleBinding`/`RoleBinding` granting access to this ServiceAccount, not just the one created above.

3. Find your cluster's **API server URL**:
    - **Cloud mode** (SquaredUp reaches your cluster directly over the internet) — for a managed cluster this is shown in your cloud provider's console (e.g. the EKS/AKS/GKE cluster endpoint), or run `kubectl cluster-info` to print it locally.
    - **Relay agent mode** (recommended for firewalled/private clusters — see [Deployment modes](#deployment-modes) below) — if the relay agent runs as a pod inside the cluster it's monitoring, use the in-cluster address `https://kubernetes.default.svc` instead of an external URL.
4. Paste the API server URL into the **API Server URL** field and the token into the **Bearer Token** field below.

### Deployment modes

This plugin is **hybrid** — it can run in **cloud mode** (SquaredUp connects to your API server directly; simplest setup, requires your API server to be reachable from the internet) or **relay agent mode** (a small on-premises agent you run inside your network relays requests out; use this for private/firewalled clusters, including local clusters like `kind`/`minikube`/OrbStack). Most real-world clusters are not internet-reachable, so relay agent mode is the common case outside a public demo cluster. See [SquaredUp's relay agent documentation](https://docs.squaredup.com/features/connect-and-explore/relay-agents) for installing the agent itself (it can run as a container anywhere with network access to your API server, including as a Deployment inside the cluster it monitors).

## Configuration fields

| Field                         | What it is                                                                                                                                      | Where to find it                                                                                                          | Required |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| **API Server URL**            | The full URL of your cluster's Kubernetes API server, including scheme and port.                                                                | `kubectl cluster-info`, or your cloud provider's cluster details page.                                                    | Yes      |
| **Bearer Token**              | Authenticates every request as the `squaredup-reader` ServiceAccount via the `Authorization: Bearer` header.                                    | Output of `kubectl create token squaredup-reader -n kube-system --duration=8760h` after applying the RBAC manifest above. | Yes      |
| **Ignore certificate errors** | Skips TLS certificate verification. Enable only for clusters with a self-signed API server certificate (e.g. local `kind`/`minikube` clusters). | N/A                                                                                                                       | No       |

> ⚠️ **Ignoring certificate errors removes protection against man-in-the-middle attacks.** With verification disabled, anything that can intercept the connection to your API server URL can impersonate it and capture your Bearer Token. Only enable this for a self-signed cluster reachable over a network path you trust (e.g. a local cluster, or an internal network via relay agent mode) — never for an API server reachable over the public internet.

On save, the plugin validates the token and URL by listing namespaces (`GET /api/v1/namespaces`) — this confirms both connectivity and that the token actually has read access to a cluster resource (a check that a non-resource endpoint like `/version` wouldn't catch); an invalid token, insufficient RBAC, unreachable URL, or TLS error (if **Ignore certificate errors** is needed but unchecked) fails setup with a connection error.

## What this plugin monitors

- **An auto-discovered service map** — namespaces, nodes, deployments, replica sets, daemon sets, stateful sets, pods, services, ingresses, and persistent volumes, wired together automatically (a pod's node, its owning controller, the services and ingresses routing to it, and its containing namespace).
- **Cluster and resource health, no Prometheus required** — node health (readiness plus memory/disk/PID pressure and network availability), workload availability (deployments, daemon sets, stateful sets), and pod/container health (crash loops, image pull failures, OOM kills) read directly from the Kubernetes API's own status conditions. This reflects node/workload/pod status, not control-plane component readiness (API server, scheduler, controller-manager, etcd) — those aren't exposed by the resource endpoints this plugin reads.
- **Live CPU/memory usage** — current node and pod resource consumption via Kubernetes' standard Metrics API (`metrics-server`), plus each pod's configured requests/limits and each node's allocatable/total capacity (including ephemeral storage), for at-a-glance capacity headroom. This is a live snapshot, not a Prometheus-style history.
- **Per-namespace resource guardrails** — ResourceQuota consumption against its hard limits (CPU, memory, pod count) and LimitRange defaults/min/max, so you can see when a namespace is approaching what it's allowed to consume.
- **A live cluster events feed** — Normal and Warning events (scheduling, image pulls, restarts, failures) as they happen.

The out-of-the-box content ships 9 perspective dashboards, one each for **Node**, **Namespace**, **Deployment**, **DaemonSet**, **StatefulSet**, **Pod**, **Service**, **Ingress**, and **Persistent Volume** — each showing that object's own health and details plus tables of what's running inside/on/behind it. Resource quotas and limit ranges appear as scoped tables on the Namespace perspective. Persistent volume claims appear there too, and via a Persistent Volume's "Claimed By" drilldown. There's no separate cluster-wide overview dashboard — start from the Namespace perspective, or the object list/graph views, for a cluster-wide view.

## Data streams

- **Namespaces**, **Nodes**, **Deployments**, **ReplicaSets**, **DaemonSets**, **StatefulSets**, **Pods**, **Services**, **Ingresses**, **Persistent Volumes**, **Resource Quotas**, **Limit Ranges** — one cluster-wide stream per object type, current state.
- **Events** — all cluster events, cluster-wide, with type, reason, message, and the object they concern.
- **Node/Pod Metrics** — current CPU/memory usage per node and per pod via the Metrics API; cluster-wide by default, or narrowed to a single Node/Pod when a perspective dashboard binds one in.
- **Namespace Contents** — one namespace-scoped stream with a "Detail Type" selector (Deployments, DaemonSets, StatefulSets, ReplicaSets, Services, Ingresses, Persistent Volume Claims, Resource Quotas, Limit Ranges, or Pods), used to drive every table on the Namespace perspective without a separate stream per object kind.
- **Pods by Parent** — one stream scoped to Node, DaemonSet, StatefulSet, or Service alike, returning the pods belonging to whichever one is currently in view (the Service case is a label-selector approximation — see Known limitations).
- **ReplicaSets owned by this Deployment** — the remaining scoped drilldown stream behind the Deployment perspective's table.

## What gets indexed

| Object type           | API source                                 | Represents                                                                            |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| **Namespace**         | `GET /api/v1/namespaces`                   | A Kubernetes namespace.                                                               |
| **Node**              | `GET /api/v1/nodes`                        | A cluster node.                                                                       |
| **Deployment**        | `GET /apis/apps/v1/deployments`            | A Kubernetes deployment.                                                              |
| **ReplicaSet**        | `GET /apis/apps/v1/replicasets`            | A replica set (bridges deployments to the pods they own).                             |
| **DaemonSet**         | `GET /apis/apps/v1/daemonsets`             | A workload scheduled on every matching node.                                          |
| **StatefulSet**       | `GET /apis/apps/v1/statefulsets`           | A workload with stable identity/storage per replica.                                  |
| **Pod**               | `GET /api/v1/pods`                         | A Kubernetes Pod, regardless of phase.                                                |
| **Service**           | `GET /api/v1/services`                     | A Kubernetes service.                                                                 |
| **Ingress**           | `GET /apis/networking.k8s.io/v1/ingresses` | An external HTTP(S) routing rule.                                                     |
| **Persistent Volume** | `GET /api/v1/persistentvolumes`            | A cluster-scoped storage volume, optionally bound to a claim.                         |
| **Resource Quota**    | `GET /api/v1/resourcequotas`               | A namespace's hard limits on aggregate resource consumption (CPU, memory, pod count). |
| **Limit Range**       | `GET /api/v1/limitranges`                  | A namespace's default/min/max resource constraints applied per container.             |

**Relationships:** Pod → Node (scheduled on); Pod → ReplicaSet (owned by) → Deployment (owned by); Pod → DaemonSet (owned by); Pod → StatefulSet (owned by); Service → Pod (routes to, label-selector approximation); Ingress → Service (routes to, primary-backend approximation); Namespace → Pod/Deployment/ReplicaSet/DaemonSet/StatefulSet/Service/Ingress/ResourceQuota/LimitRange (contains).

## Known limitations

- **CPU/memory usage requires `metrics-server`.** If it isn't installed in your cluster, the usage tiles will show no data (the rest of the plugin is unaffected) — see the note in Setup.
- **Label-selector matching is approximate.** Real Kubernetes Service→Pod matching requires every key/value pair in a service's selector to be present on the pod (a subset match); this plugin approximates it by matching a single well-known label key (`app`, falling back to `app.kubernetes.io/name`, then `k8s-app`). This covers the large majority of real-world services but can miss services selecting on other/multiple keys, or falsely match unrelated pods that happen to share the same resolved value in rare cases.
- **Ingress→Service matching is a single-backend approximation.** An Ingress can route different paths/hosts to different services; this plugin correlates on one "primary" backend (the default backend if set, otherwise the first rule's first path) rather than modeling every path individually.
- **Cluster-wide read RBAC required.** The unscoped, cluster-wide streams (Namespaces, Nodes, Deployments, ReplicaSets, DaemonSets, StatefulSets, Pods, Services, Ingresses, Persistent Volumes, Resource Quotas, Limit Ranges, Events, Node/Pod Metrics) all issue cluster-wide `list` calls — a ServiceAccount restricted to specific namespaces won't work for these. The namespaced drilldown streams (Namespace Contents, and the namespaced case of Pods by Parent and Persistent Volume Claims) issue per-namespace requests instead, so they only need `list`/`get` in the namespace(s) actually being viewed — but the RBAC manifest above still grants cluster-wide access for simplicity, since this plugin's dashboards otherwise assume cluster-wide visibility anyway.
- **No historical metrics.** Every data stream, including CPU/memory usage, is a current-state snapshot (`timeframes: false`) — there is no time-series history. Add a Prometheus-based plugin alongside this one if you need trends over time.
- **No mTLS / client-certificate authentication.** Only a ServiceAccount bearer token is supported, which is also the standard way external tools authenticate to a Kubernetes API server.
- **v1 object coverage.** Jobs/CronJobs are not yet imported — a future addition.
- **Read-only.** This plugin never creates, modifies, or deletes anything in your cluster.
