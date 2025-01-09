#!/usr/bin/env bash

# This script will restart a process every time it exits
# This is purely to demonstrate restarts in the scope of this example.
# Do not use this for your own projects.
process=$1

if [ -z "$process" ]; then
    echo "Please provide a command to execute"
    exit 1
fi

while true; do
    $process
    sleep 1
done
