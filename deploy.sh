#!/bin/bash
set -euo pipefail

################################################################################
# Whiteboard App - Free Tier Deployment (Single EC2 t2.micro)
# - Next.js app + WebSocket sync server on one instance
# - Free tier eligible: 750 hours/month
# - Cost: $0/month (first 12 months) or ~$8/month after
################################################################################

# ---------- CONFIG ----------
AWS_REGION="${AWS_REGION:-ap-south-1}"
INSTANCE_TYPE="t2.micro"  # Free tier eligible
KEY_NAME="${KEY_NAME:-whiteboard-key}"
INSTANCE_NAME="whiteboard-free-tier"
# ----------------------------

echo "🚀 Deploying to FREE TIER EC2 (t2.micro)"
echo "   Region: $AWS_REGION"
echo

# ---------- Prechecks ----------
command -v aws >/dev/null 2>&1 || { echo "❌ aws CLI required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm required"; exit 1; }

aws sts get-caller-identity >/dev/null || { echo "❌ AWS credentials not configured"; exit 1; }
echo "✅ AWS credentials verified"

# ---------- Read .env ----------
read_env_key() {
  grep -E "^${2}=" "$1" 2>/dev/null | awk -F= '{print substr($0, index($0,$2))}' | sed 's/^["'\'']\|["'\'']$//g' || true
}

DATABASE_URL="$(read_env_key .env DATABASE_URL)"
COGNITO_REGION="$(read_env_key .env NEXT_PUBLIC_AWS_REGION)"
COGNITO_POOL_ID="$(read_env_key .env NEXT_PUBLIC_COGNITO_USER_POOL_ID)"
COGNITO_CLIENT_ID="$(read_env_key .env NEXT_PUBLIC_COGNITO_CLIENT_ID)"

[ -z "$DATABASE_URL" ] && { echo "❌ DATABASE_URL not found in .env"; exit 1; }

# ---------- SSH Key ----------
echo "🔑 Checking key pair: $KEY_NAME"

# Check for key in .ssh directory first
if [ -f "$HOME/.ssh/${KEY_NAME}.pem" ]; then
  KEY_PATH="$HOME/.ssh/${KEY_NAME}.pem"
  echo "✅ Using existing key: $KEY_PATH"
elif [ -f "${KEY_NAME}.pem" ]; then
  KEY_PATH="${KEY_NAME}.pem"
  echo "✅ Using existing key: $KEY_PATH"
else
  # Create new key if doesn't exist
  if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    KEY_PATH="$HOME/.ssh/${KEY_NAME}.pem"
    mkdir -p "$HOME/.ssh"
    aws ec2 create-key-pair --key-name "$KEY_NAME" --region "$AWS_REGION" \
      --query "KeyMaterial" --output text > "$KEY_PATH"
    chmod 400 "$KEY_PATH"
    echo "✅ Created: $KEY_PATH"
  else
    echo "❌ Key pair exists in AWS but not found locally"
    echo "   Expected location: $HOME/.ssh/${KEY_NAME}.pem"
    exit 1
  fi
fi

# ---------- Security Group ----------
SG_NAME="whiteboard-sg"
echo "🔒 Setting up security group..."
if ! aws ec2 describe-security-groups --group-names "$SG_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
  VPC_ID=$(aws ec2 describe-vpcs --region "$AWS_REGION" --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
  SG_ID=$(aws ec2 create-security-group --group-name "$SG_NAME" --description "Whiteboard" --vpc-id "$VPC_ID" --region "$AWS_REGION" --query "GroupId" --output text)
  
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$AWS_REGION" 2>/dev/null || true
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region "$AWS_REGION" 2>/dev/null || true
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 5858 --cidr 0.0.0.0/0 --region "$AWS_REGION" 2>/dev/null || true
  aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0 --region "$AWS_REGION" 2>/dev/null || true
  echo "✅ Created: $SG_ID"
else
  SG_ID=$(aws ec2 describe-security-groups --group-names "$SG_NAME" --region "$AWS_REGION" --query "SecurityGroups[0].GroupId" --output text)
  echo "✅ Using existing: $SG_ID"
fi

# ---------- Get AMI ----------
AMI_ID=$(aws ec2 describe-images --region "$AWS_REGION" --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023.*-x86_64" "Name=state,Values=available" \
  --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" --output text)

# ---------- Build App ----------
echo "🏗 Building application..."
npm ci || npm install
npm run build

echo "📦 Creating deployment package..."
tar -czf app.tar.gz \
  --exclude=node_modules --exclude=.git --exclude=.next/cache --exclude=*.md --exclude=check-db.js \
  .next src package.json package-lock.json prisma sync-server 2>/dev/null || \
tar -czf app.tar.gz \
  --exclude=node_modules --exclude=.git --exclude=.next/cache --exclude=*.md \
  .next src package.json package-lock.json prisma sync-server

# ---------- User Data ----------
cat > user-data.sh <<'USERDATA'
#!/bin/bash
yum update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git nginx
npm install -g pm2

mkdir -p /home/ec2-user/app
chown -R ec2-user:ec2-user /home/ec2-user/app

cat > /etc/nginx/conf.d/app.conf <<'NGINX'
server {
    listen 80;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
    location /sync {
        proxy_pass http://localhost:5858;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

systemctl enable nginx
systemctl start nginx
USERDATA

# ---------- Check Existing Instance ----------
echo "🔍 Checking for existing instance..."
EXISTING_INSTANCE=$(aws ec2 describe-instances --region "$AWS_REGION" \
  --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
  --query "Reservations[0].Instances[0].InstanceId" --output text 2>/dev/null || echo "None")

if [ "$EXISTING_INSTANCE" != "None" ] && [ -n "$EXISTING_INSTANCE" ]; then
  echo "⚠️  Instance already exists: $EXISTING_INSTANCE"
  read -p "Terminate and recreate? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Terminating old instance..."
    aws ec2 terminate-instances --instance-ids "$EXISTING_INSTANCE" --region "$AWS_REGION" >/dev/null
    aws ec2 wait instance-terminated --instance-ids "$EXISTING_INSTANCE" --region "$AWS_REGION"
  else
    echo "❌ Deployment cancelled"
    exit 1
  fi
fi

# ---------- Launch Instance ----------
echo "🚀 Launching t2.micro instance..."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --user-data file://user-data.sh \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
  --region "$AWS_REGION" \
  --query "Instances[0].InstanceId" --output text)

echo "⏳ Waiting for instance..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"

PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$AWS_REGION" \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text)

echo "✅ Instance: $PUBLIC_IP"
echo "⏳ Waiting 60s for setup..."
sleep 60

# ---------- Deploy ----------
echo "📤 Deploying application..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no app.tar.gz ec2-user@$PUBLIC_IP:/home/ec2-user/app/

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP <<REMOTE
cd /home/ec2-user/app
tar -xzf app.tar.gz && rm app.tar.gz
npm ci --production

cat > .env <<'ENV'
DATABASE_URL=$DATABASE_URL
NODE_ENV=production
NEXT_PUBLIC_AWS_REGION=$COGNITO_REGION
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$COGNITO_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
NEXT_PUBLIC_SYNC_SERVER_URL=ws://$PUBLIC_IP:5858
ENV

sed -i "s|\$DATABASE_URL|$DATABASE_URL|g" .env
sed -i "s|\$COGNITO_REGION|$COGNITO_REGION|g" .env
sed -i "s|\$COGNITO_POOL_ID|$COGNITO_POOL_ID|g" .env
sed -i "s|\$COGNITO_CLIENT_ID|$COGNITO_CLIENT_ID|g" .env
sed -i "s|\$PUBLIC_IP|$PUBLIC_IP|g" .env

npx prisma generate
npx prisma migrate deploy

pm2 start npm --name "nextjs" -- start
pm2 start sync-server/server.mjs --name "sync"
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user
sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
REMOTE

rm -f app.tar.gz user-data.sh

# ---------- Summary ----------
echo
echo "🎉 FREE TIER Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 App: http://$PUBLIC_IP"
echo "🔄 Sync: ws://$PUBLIC_IP:5858"
echo "🔑 SSH: ssh -i $KEY_PATH ec2-user@$PUBLIC_IP"
echo "📊 Instance: $INSTANCE_ID (t2.micro)"
echo
echo "💰 Cost: FREE (first 12 months) or ~$8/month after"
echo "⏰ Free tier: 750 hours/month (31 days = 744 hours)"
echo
echo "⚠️  To terminate:"
echo "   aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $AWS_REGION"
echo
exit 0
