#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ -f .env.test ]; then
  export $(cat .env.test | grep -v '^#' | xargs)
fi

API_BASE=${API_TARGET:-"http://localhost:8080"}
USER_ID=${TEST_USER_ID}
TOKEN=${TEST_TOKEN}

echo -e "${BLUE}==================== 批量添加测试数据 ====================${NC}\n"

SUCCESS_COUNT=0
FAILED_COUNT=0

# 生成随机体重 (60-80 kg)
random_weight() {
  echo "scale=1; 60 + ($RANDOM % 200) / 10" | bc
}

# 生成随机身高 (165-180 cm)
random_height() {
  echo "165 + ($RANDOM % 16)" | bc
}

add_data() {
  local date=$1
  local weight=$2
  local height=$3

  echo -e "${YELLOW}添加数据: ${date} - 身高: ${height}cm, 体重: ${weight}kg${NC}"

  local data=$(cat <<EOF
{
  "userID": "${USER_ID}",
  "heightCM": ${height},
  "weightKG": ${weight},
  "recordDate": "${date}"
}
EOF
)

  response=$(curl -s -w "\n%{http_code}" -X POST \
    "${API_BASE}/body-metrics" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$data")

  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq 200 ]; then
    code=$(echo "$body" | jq -r '.code' 2>/dev/null || echo "0")
    if [ "$code" -eq 1 ]; then
      echo -e "${GREEN}✓ 成功${NC}\n"
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      echo -e "${RED}✗ 失败: $(echo "$body" | jq -r '.msg' 2>/dev/null || echo "未知错误")${NC}\n"
      FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
  else
    echo -e "${RED}✗ HTTP 错误 $http_code${NC}\n"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  fi
}

# 生成最近 30 天的数据（每天一条）
echo -e "${BLUE}开始生成数据...${NC}\n"

for i in {0..29}; do
  # 计算日期（从今天往前推）
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    date=$(date -v-${i}d +%Y-%m-%d)
  else
    # Linux
    date=$(date -d "${i} days ago" +%Y-%m-%d)
  fi

  # 生成随机体重和身高
  weight=$(random_weight)
  height=$(random_height)

  # 添加数据
  add_data "$date" "$weight" "$height"

  # 避免请求过快
  sleep 0.1
done

echo -e "\n${BLUE}==================== 数据添加完成 ====================${NC}"
echo -e "${GREEN}成功: ${SUCCESS_COUNT}${NC}"
echo -e "${RED}失败: ${FAILED_COUNT}${NC}"
echo -e "${BLUE}=====================================================${NC}\n"

echo -e "${YELLOW}查询总数据量...${NC}"
response=$(curl -s \
  "${API_BASE}/body-metrics?page=1&pageSize=100&userID=${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

total=$(echo "$response" | jq -r '.data.total' 2>/dev/null || echo "0")
echo -e "${GREEN}当前总记录数: ${total}${NC}\n"

if [ "$total" -gt 10 ]; then
  echo -e "${GREEN}✓ 数据充足，可以测试分页功能了！${NC}"
  echo -e "${BLUE}提示：每页显示 10 条，总共约 $((total / 10 + 1)) 页${NC}"
else
  echo -e "${YELLOW}⚠ 数据较少，建议重新运行脚本添加更多数据${NC}"
fi
