// Creates the Kubernetes Cluster object for the data source's "Default cluster name", so
// pods, nodes and namespaces filed under it have a cluster to belong to. Only when the
// name is set and Kubernetes logs were seen in the lookback. Its filter matches logs with
// Kubernetes fields and either that cluster or no cluster field.
const dataSource = (Array.isArray(context.dataSources) && context.dataSources[0]) || {};
const name = typeof dataSource.defaultCluster === 'string' ? dataSource.defaultCluster.trim() : '';
const hits = Number(data?.data?.result?.[0]?.value?.[1] || 0);
const quote = (v) => JSON.stringify(String(v));
const enabled = dataSource.indexOtelK8s !== false || dataSource.indexK8sCollector !== false;
result =
    name && hits > 0 && enabled
        ? [{
              id: name,
              name,
              cluster: name,
              selector: `(("k8s.cluster.name":in(${quote(name)}, "") "cluster":in(${quote(name)}, "")) ("k8s.namespace.name":* or "kubernetes.pod_namespace":* or "kubernetes.namespace_name":* or "namespace":*))`
          }]
        : [];
