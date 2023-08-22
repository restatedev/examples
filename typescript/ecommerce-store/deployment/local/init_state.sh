#!/bin/bash
export RESTATE_HOST=${1:-localhost:9090}
jq -c '.data.products[]' ../data/products.json | while read i; do
  id=$(echo $i | jq -r '.id')
  quantity=$(echo $i | jq -r '.installments')
  price=$(echo $i | jq -r '.price')
  price_in_cents=$(LC_NUMERIC="en_US.UTF-8" printf "%.f" "$(echo "$price * 100" | bc)")
  echo "{ product_id : \"${id}\", new_price_in_cents: ${price_in_cents}, amount: ${quantity}}"
  curl -X POST ${RESTATE_HOST}/io.shoppingcart.ProductService/NotifyNewQuantityInStock -H 'content-type: application/json' -d "{ \"product_id\" : \"${id}\", \"new_price_in_cents\": 4900, \"amount\": ${quantity}}"
done
