#!/bin/bash
echo "max_prepared_transactions = 100" >> "$PGDATA/postgresql.conf"
