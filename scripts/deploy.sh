#!/usr/bin/env bash
#
# Deploy TicTacPlane to Google Cloud Run.
#
# Prerequisites (run once, interactively, with an account that can create
# projects and link billing — e.g. sivan.yogev@gmail.com):
#
#   gcloud auth login sivan.yogev@gmail.com
#   gcloud projects create "$PROJECT_ID"
#   gcloud billing projects link "$PROJECT_ID" --billing-account=XXXXXX-XXXXXX-XXXXXX
#
# Then run this script:  PROJECT_ID=tictacplane-123 ./scripts/deploy.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID to your target Google Cloud project}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-tictacplane}"

echo "Deploying '$SERVICE' to project '$PROJECT_ID' in '$REGION'..."

gcloud config set project "$PROJECT_ID"

# Enable the APIs needed to build and run the container.
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com

# Build from the Dockerfile (Cloud Build) and deploy.
# Scale to zero when nobody is playing to avoid idle CPU and memory charges.
# Keep one vCPU so Cloud Run can accept both players' concurrent WebSockets;
# fractional CPUs require concurrency=1. Game rooms live in memory, so one
# instance remains the maximum. --timeout keeps WebSockets open.
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1 \
  --cpu 1 \
  --memory 128Mi \
  --cpu-throttling \
  --no-cpu-boost \
  --session-affinity \
  --timeout 3600

echo
echo "Done. Service URL:"
gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'
