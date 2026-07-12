#!/usr/bin/env bash
set -euo pipefail

NETWORK="${REPAGER_DOCKER_NETWORK:-hermes-data-fresh_default}"
ID=$(docker network inspect -f '{{.Id}}' "$NETWORK")
SUBNET=$(docker network inspect -f '{{(index .IPAM.Config 0).Subnet}}' "$NETWORK")
BRIDGE="br-${ID:0:12}"

iptables -N REPAGER_EGRESS 2>/dev/null || true
iptables -F REPAGER_EGRESS
iptables -A REPAGER_EGRESS -d "$SUBNET" -j RETURN

for cidr in \
  0.0.0.0/8 \
  10.0.0.0/8 \
  100.64.0.0/10 \
  127.0.0.0/8 \
  169.254.0.0/16 \
  172.16.0.0/12 \
  192.0.0.0/24 \
  192.0.2.0/24 \
  192.168.0.0/16 \
  198.18.0.0/15 \
  198.51.100.0/24 \
  203.0.113.0/24 \
  224.0.0.0/4 \
  240.0.0.0/4; do
  iptables -A REPAGER_EGRESS -d "$cidr" -j REJECT
done

iptables -A REPAGER_EGRESS -j RETURN
iptables -C DOCKER-USER -i "$BRIDGE" -j REPAGER_EGRESS 2>/dev/null || \
  iptables -I DOCKER-USER 1 -i "$BRIDGE" -j REPAGER_EGRESS
