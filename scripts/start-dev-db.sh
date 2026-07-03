#!/usr/bin/env sh
set -eu

service_name="${AFTERSERVICE_DB_SERVICE:-postgres}"
database_name="${AFTERSERVICE_DB_NAME:-anodizex}"
database_user="${AFTERSERVICE_DB_USER:-anodizex}"
database_url="${DATABASE_URL:-postgresql://${database_user}:${database_user}@localhost:55435/${database_name}}"
database_port="${AFTERSERVICE_DB_PORT:-55435}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to start the local database."
  exit 1
fi

echo "Starting local Postgres service: ${service_name}"

existing_container="$(docker ps --filter "publish=${database_port}" --format "{{.Names}}" | sed -n '1p')"

if [ -n "${existing_container}" ]; then
  if docker exec "${existing_container}" pg_isready -U "${database_user}" -d "${database_name}" >/dev/null 2>&1; then
    echo "Local Postgres is already ready in Docker container: ${existing_container}"
    echo "DATABASE_URL=${database_url}"
    exit 0
  fi

  health_status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${existing_container}" 2>/dev/null || echo "unknown")"

  if [ "${health_status}" = "healthy" ]; then
    echo "A healthy Docker container is already listening on port ${database_port}: ${existing_container}"
    echo "DATABASE_URL=${database_url}"
    exit 0
  fi

  echo "Port ${database_port} is already used by Docker container ${existing_container}, but it is not ready for this database."
  echo "Container health/status: ${health_status}"
  exit 1
fi

docker compose up -d "${service_name}"

container_id="$(docker compose ps -q "${service_name}")"

if [ -z "${container_id}" ]; then
  echo "Could not find a running container for ${service_name}."
  exit 1
fi

attempt=0

while [ "${attempt}" -lt 40 ]; do
  health_status="$(docker inspect -f '{{.State.Health.Status}}' "${container_id}" 2>/dev/null || echo "starting")"

  if [ "${health_status}" = "healthy" ]; then
    echo "Local Postgres is ready."
    echo "DATABASE_URL=${database_url}"
    exit 0
  fi

  if [ "${health_status}" = "unhealthy" ]; then
    echo "Local Postgres became unhealthy."
    docker compose logs --tail=60 "${service_name}"
    exit 1
  fi

  attempt=$((attempt + 1))
  sleep 1
done

echo "Timed out waiting for local Postgres to become healthy."
docker compose ps "${service_name}"
exit 1
