#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${IMAGE_TAG:-posterboy2:latest}"

echo "Building Docker image: ${IMAGE_TAG}"

docker build \
  -t "${IMAGE_TAG}" \
  .

echo "Done."
echo "Tip: Backend MQTT broker config is set via docker-compose or MQTT_BROKER_URL env var."