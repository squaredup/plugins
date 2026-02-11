if (data.aggregations && data.aggregations.length > 0) {
  
  const agg = data.aggregations[Object.keys(data.aggregations).at(-1)]; // last aggregation to support pipelining

  if(agg.buckets) {

    result = agg.buckets;
  
  } else if (agg.values) {

    result = [agg.values];

  } else if (agg.value) {

    result = [{
      value: agg.value
    }];

  } else {

    result = [agg];

  }

} else {
  
  result = data.hits.hits.map(hit => hit._source);

}



