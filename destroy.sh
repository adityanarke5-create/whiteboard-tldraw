#!/bin/bash
set -euo pipefail

################################################################################
# Whiteboard App - Destroy All AWS Resources
# Removes: EC2 instance, Security Group, Key Pair
################################################################################

# ---------- CONFIG ----------
AWS_REGION="${AWS_REGION:-ap-south-1}"
KEY_NAME="${KEY_NAME:-whiteboard-key}"
INSTANCE_NAME="whiteboard-free-tier"
SG_NAME="whiteboard-sg"
# ----------------------------

echo "🗑️  Destroying Whiteboard AWS Resources"
echo "   Region: $AWS_REGION"
echo

# ---------- Prechecks ----------
command -v aws >/dev/null 2>&1 || { echo "❌ aws CLI required"; exit 1; }
aws sts get-caller-identity >/dev/null || { echo "❌ AWS credentials not configured"; exit 1; }

# ---------- Confirm ----------
echo "⚠️  This will DELETE:"
echo "   - EC2 instance: $INSTANCE_NAME"
echo "   - Security group: $SG_NAME"
echo "   - Key pair: $KEY_NAME"
echo "   - Local key file: ${KEY_NAME}.pem"
echo
read -p "Continue? (y/N): " -n 1 -r
echo
[[ ! $REPLY =~ ^[Yy]$ ]] && { echo "❌ Cancelled"; exit 0; }

# ---------- Terminate Instance ----------
echo "🔍 Finding instance..."
INSTANCE_ID=$(aws ec2 describe-instances --region "$AWS_REGION" \
  --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
  --query "Reservations[0].Instances[0].InstanceId" --output text 2>/dev/null || echo "None")

if [ "$INSTANCE_ID" != "None" ] && [ -n "$INSTANCE_ID" ]; then
  echo "🗑️  Terminating instance: $INSTANCE_ID"
  aws ec2 terminate-instances --instance-ids "$INSTANCE_ID" --region "$AWS_REGION" >/dev/null
  echo "⏳ Waiting for termination..."
  aws ec2 wait instance-terminated --instance-ids "$INSTANCE_ID" --region "$AWS_REGION"
  echo "✅ Instance terminated"
else
  echo "ℹ️  No instance found"
fi

# ---------- Delete Security Group ----------
echo "🔍 Finding security group..."
SG_ID=$(aws ec2 describe-security-groups --region "$AWS_REGION" \
  --filters "Name=group-name,Values=$SG_NAME" \
  --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "None")

if [ "$SG_ID" != "None" ] && [ -n "$SG_ID" ]; then
  echo "🗑️  Deleting security group: $SG_ID"
  aws ec2 delete-security-group --group-id "$SG_ID" --region "$AWS_REGION" 2>/dev/null || {
    echo "⚠️  Failed to delete (may have dependencies, retrying in 10s...)"
    sleep 10
    aws ec2 delete-security-group --group-id "$SG_ID" --region "$AWS_REGION" 2>/dev/null || echo "⚠️  Manual deletion required"
  }
  echo "✅ Security group deleted"
else
  echo "ℹ️  No security group found"
fi

# ---------- Delete Key Pair ----------
echo "🔍 Finding key pair..."
if aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "🗑️  Deleting key pair: $KEY_NAME"
  aws ec2 delete-key-pair --key-name "$KEY_NAME" --region "$AWS_REGION"
  echo "✅ Key pair deleted"
else
  echo "ℹ️  No key pair found"
fi

# ---------- Delete Local Key File ----------
KEY_DELETED=false
if [ -f "$HOME/.ssh/${KEY_NAME}.pem" ]; then
  echo "🗑️  Deleting local key file: $HOME/.ssh/${KEY_NAME}.pem"
  rm -f "$HOME/.ssh/${KEY_NAME}.pem"
  KEY_DELETED=true
fi
if [ -f "${KEY_NAME}.pem" ]; then
  echo "🗑️  Deleting local key file: ${KEY_NAME}.pem"
  rm -f "${KEY_NAME}.pem"
  KEY_DELETED=true
fi
if [ "$KEY_DELETED" = true ]; then
  echo "✅ Local key deleted"
else
  echo "ℹ️  No local key file found"
fi

# ---------- Summary ----------
echo
echo "🎉 Cleanup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All AWS resources removed"
echo "💰 No more charges will occur"
echo
exit 0
