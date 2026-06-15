const rows = data.rows ?? [];

result = rows.map(row => {
  const position = row.position ?? 0;

  let Bucket = "51+";

  if (position <= 3) Bucket = "1-3";
  else if (position <= 10) Bucket = "4-10";
  else if (position <= 20) Bucket = "11-20";
  else if (position <= 50) Bucket = "21-50";

  return {
    Bucket,
    Queries: 1
  };
});