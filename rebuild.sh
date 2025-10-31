#!/bin/bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-ap-south-1}"
INSTANCE_NAME="whiteboard-free-tier"
KEY_NAME="${KEY_NAME:-whiteboard-key}"

# Find key
if [ -f "$HOME/.ssh/${KEY_NAME}.pem" ]; then
  KEY_PATH="$HOME/.ssh/${KEY_NAME}.pem"
elif [ -f "${KEY_NAME}.pem" ]; then
  KEY_PATH="${KEY_NAME}.pem"
else
  echo "❌ Key not found"
  exit 1
fi

# Get instance IP
PUBLIC_IP=$(aws ec2 describe-instances --region "$AWS_REGION" \
  --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text 2>/dev/null)

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
  echo "❌ No running instance found"
  exit 1
fi

echo "🔄 Rebuilding Next.js on $PUBLIC_IP with correct env..."

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP bash <<REMOTE
cd /home/ec2-user/app
pm2 delete all
npm run build
pm2 start npm --name "nextjs" -- start
pm2 start sync-server/server.mjs --name "sync"
pm2 save
echo ""
echo "✅ Rebuild complete!"
pm2 status
REMOTE
