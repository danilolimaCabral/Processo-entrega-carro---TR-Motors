#!/bin/sh
echo "=== Starting server without automatic database migrations ==="
exec node dist/index.js
