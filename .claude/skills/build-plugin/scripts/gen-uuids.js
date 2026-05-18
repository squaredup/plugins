#!/usr/bin/env node
const n = parseInt(process.argv[2] ?? "1", 10);
if (isNaN(n) || n < 1) {
    console.error("Usage: gen-uuids.js [count]");
    console.error("count must be a positive integer");
    process.exit(1);
}
for (let i = 0; i < n; i++) console.log(crypto.randomUUID());
