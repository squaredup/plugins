const n = parseInt(process.argv[2] ?? '1', 10);
for (let i = 0; i < n; i++) console.log(crypto.randomUUID());
