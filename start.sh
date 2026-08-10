#!/bin/sh
node migrate.js || true
echo "=== Starting server ==="
exec node dist/index.js
