#!/bin/bash

process=$1

if [ -z "$process" ]; then
    echo "Please provide a command to execute"
    exit 1
fi

while true; do
    $process
    sleep 1
done