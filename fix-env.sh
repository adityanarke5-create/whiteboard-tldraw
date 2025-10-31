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

# Get instance IP
PUBLIC_IP=$(aws ec2 describe-instances --region "$AWS_REGION" \
  --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text 2>/dev/null)

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
  echo "❌ No running instance found"
  exit 1
fi

echo "🔧 Fixing .env on $PUBLIC_IP"

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP bash <<REMOTE
cd /home/ec2-user/app
cat > .env <<'EOF'
DATABASE_URL=$DATABASE_URL
NODE_ENV=production
NEXT_PUBLIC_AWS_REGION=$COGNITO_REGION
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$COGNITO_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
NEXT_PUBLIC_SYNC_SERVER_URL=ws://$PUBLIC_IP:5858
EOF

sed -i "s|\\\$DATABASE_URL|$DATABASE_URL|g" .env
sed -i "s|\\\$COGNITO_REGION|$COGNITO_REGION|g" .env
sed -i "s|\\\$COGNITO_POOL_ID|$COGNITO_POOL_ID|g" .env
sed -i "s|\\\$COGNITO_CLIENT_ID|$COGNITO_CLIENT_ID|g" .env
sed -i "s|\\\$PUBLIC_IP|$PUBLIC_IP|g" .env

echo "✅ Fixed .env"
cat .env
echo ""
echo "🔄 Restarting services..."
pm2 restart all
REMOTE

echo "✅ Done! Check logs with: bash logs.sh"
