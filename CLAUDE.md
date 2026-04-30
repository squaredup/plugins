# Plugin Authoring Guidelines

## Status mappings

Where an API returns a numeric or coded status value that needs mapping to a human-readable label and a SquaredUp state, implement the mapping directly in the data stream `.json` file using a `computed` column with a `valueExpression` ternary chain. Only use a `.js` post-request script when the mapping logic is too complex for an expression (e.g. requires lookups across multiple fields or external data).

Example:

```json
{
    "name": "statusName",
    "displayName": "Status",
    "computed": true,
    "valueExpression": "{{ $['status'] == 1 ? 'Open' : $['status'] == 2 ? 'Closed' : 'Unknown' }}",
    "shape": ["state", {
        "map": {
            "warning": ["Open"],
            "success": ["Closed"],
            "unknown": ["Unknown"]
        }
    }]
}
```
