#!/bin/sh
echo "=== Running migrations ==="
node migrate.js || true
echo "=== Starting server ==="
exec node dist/index.js
