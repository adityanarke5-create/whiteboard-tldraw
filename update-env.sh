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

# Read local .env
read_env_key() {
  grep -E "^${2}=" "$1" 2>/dev/null | awk -F= '{print substr($0, index($0,$2))}' | sed 's/^["'\'']\|["'\'']$//g' || true
}

DATABASE_URL="$(read_env_key .env DATABASE_URL)"
COGNITO_REGION="$(read_env_key .env NEXT_PUBLIC_AWS_REGION)"
COGNITO_POOL_ID="$(read_env_key .env NEXT_PUBLIC_COGNITO_USER_POOL_ID)"
COGNITO_CLIENT_ID="$(read_env_key .env NEXT_PUBLIC_COGNITO_CLIENT_ID)"
SYNC_URL="$(read_env_key .env NEXT_PUBLIC_SYNC_SERVER_URL)"

# Get instance IP
PUBLIC_IP=$(aws ec2 describe-instances --region "$AWS_REGION" \
  --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text 2>/dev/null)

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
  echo "❌ No running instance found"
  exit 1
fi

echo "🔧 Updating .env and rebuilding on $PUBLIC_IP"

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP bash <<REMOTE
cd /home/ec2-user/app

cat > .env <<'EOF'
DATABASE_URL=$DATABASE_URL
NODE_ENV=production
NEXT_PUBLIC_AWS_REGION=$COGNITO_REGION
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$COGNITO_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
NEXT_PUBLIC_SYNC_SERVER_URL=$SYNC_URL
EOF

sed -i "s|\\\$DATABASE_URL|$DATABASE_URL|g" .env
sed -i "s|\\\$COGNITO_REGION|$COGNITO_REGION|g" .env
sed -i "s|\\\$COGNITO_POOL_ID|$COGNITO_POOL_ID|g" .env
sed -i "s|\\\$COGNITO_CLIENT_ID|$COGNITO_CLIENT_ID|g" .env
sed -i "s|\\\$SYNC_URL|$SYNC_URL|g" .env

echo "✅ Updated .env:"
cat .env
echo ""

echo "🔄 Stopping services..."
pm2 stop all

echo "🏗️  Rebuilding Next.js..."
npm run build

echo "🚀 Starting services..."
pm2 start all

echo "✅ Done!"
pm2 status
REMOTE

echo "✅ Complete! App restarted with new env"
