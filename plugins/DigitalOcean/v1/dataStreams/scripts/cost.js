// The API omits data_points entirely when there is no usage, which would otherwise surface as one empty row
result = data.data_points || [];
