#!/bin/bash

mapfile -t addresses < addresses.csv

echo "Found ${#addresses[@]} addresses to process" >&2

for address in "${addresses[@]}"; do

    IFS=',' read -r street city state zip <<< "$address"
    
    echo "Processing $street, $city, $state $zip..." >&2

    encoded_street=$(echo "$street" | sed 's/ /+/g')
    encoded_city=$(echo "$city" | sed 's/ /+/g')

    request_url="https://geocoding.geo.census.gov/geocoder/locations/address?street=${encoded_street}&city=${encoded_city}&state=${state}&zip=${zip}&benchmark=2020&format=json"
    census_response=$(curl -s "$request_url")

    lat=$(echo "$census_response" | grep -o '"y":[0-9.-]*' | head -1 | cut -d':' -f2 | tr -d ',')
    lon=$(echo "$census_response" | grep -o '"x":[0-9.-]*' | head -1 | cut -d':' -f2 | tr -d ',')

    if [ -z "$lat" ] || [ -z "$lon" ]; then
        echo "Failed to parse coordinates for $street" >&2
        continue
    fi

    encoded_street_wm=$(echo "$street" | sed 's/ /%20/g')
    response=$(curl -s "https://webapi.wm.com/v1/catalogs/products?latitude=$lat&longitude=$lon&city=$city&state=$state&street=$encoded_street_wm&zipcode=$zip&country=US&locale=en_US&product_type=curb_side&service_type=&number_of_days=0" \
    -H "accept: application/json" \
    -H "clientid: 0oa2a4n454qQs5IlK2p7" \
    -H "origin: https://www.wm.com" \
    -H "referer: https://www.wm.com/" \
    -H "request-tracking-id: $(date +%s)")

    full_address="$street, $city, $state $zip"
    echo "{ \"address\": \"$full_address\", \"wmData\": $response }" | node extract.js

    sleep 1
done

echo "Processing complete!" >&2