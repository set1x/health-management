#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -f .env.test ]; then
  export $(cat .env.test | grep -v '^#' | xargs)
fi

API_BASE=${API_TARGET:-"http://localhost:8080"}
USER_ID=${TEST_USER_ID}
TOKEN=${TEST_TOKEN}

echo -e "${YELLOW}开始测试饮食记录 API...${NC}\n"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

test_api() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_code=$5

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  echo -e "${YELLOW}测试: ${test_name}${NC}"

  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method \
      "${API_BASE}${endpoint}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" -X $method \
      "${API_BASE}${endpoint}" \
      -H "Authorization: Bearer ${TOKEN}")
  fi

  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq "$expected_code" ]; then
    echo -e "${GREEN}✓ 通过 (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ 失败 (期望 HTTP $expected_code, 实际 $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi

  echo ""
}

# 1. 测试分页查询
test_api \
  "分页查询饮食记录" \
  "GET" \
  "/diet-items?page=1&pageSize=10&userID=${USER_ID}" \
  "" \
  200

# 2. 测试日期范围查询
test_api \
  "日期范围查询" \
  "GET" \
  "/diet-items?page=1&pageSize=10&userID=${USER_ID}&startDate=2025-10-21&endDate=2025-10-22" \
  "" \
  200

# 3. 测试餐型筛选
test_api \
  "餐型筛选查询" \
  "GET" \
  "/diet-items?page=1&pageSize=10&userID=${USER_ID}&mealType=早餐" \
  "" \
  200

# 4. 测试创建记录（注意：字段名是 estimatedCalories 不是 calories）
NEW_RECORD=$(cat <<EOF
{
  "userID": "${USER_ID}",
  "mealType": "午餐",
  "foodName": "测试食物",
  "estimatedCalories": 500,
  "recordDate": "2025-10-22"
}
EOF
)

test_api \
  "创建饮食记录" \
  "POST" \
  "/diet-items" \
  "$NEW_RECORD" \
  200

# 5. 获取新创建的记录 ID
echo -e "${YELLOW}获取最新记录 ID...${NC}"
LATEST_RECORD=$(curl -s \
  "${API_BASE}/diet-items?page=1&pageSize=1&userID=${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

RECORD_ID=$(echo "$LATEST_RECORD" | jq -r '.data.rows[0].dietItemID')
echo -e "记录 ID: ${GREEN}${RECORD_ID}${NC}\n"

# 6. 测试查询单条记录
test_api \
  "查询单条记录" \
  "GET" \
  "/diet-items/${RECORD_ID}" \
  "" \
  200

# 7. 测试更新记录
UPDATE_RECORD=$(cat <<EOF
{
  "userID": "${USER_ID}",
  "mealType": "午餐",
  "foodName": "更新后的食物",
  "estimatedCalories": 600,
  "recordDate": "2025-10-22"
}
EOF
)

test_api \
  "更新饮食记录" \
  "PUT" \
  "/diet-items/${RECORD_ID}" \
  "$UPDATE_RECORD" \
  200

# 8. 测试删除记录
test_api \
  "删除饮食记录" \
  "DELETE" \
  "/diet-items/${RECORD_ID}" \
  "" \
  200

echo -e "\n${YELLOW}==================== 测试摘要 ====================${NC}"
echo -e "总测试数: ${TOTAL_TESTS}"
echo -e "${GREEN}通过: ${PASSED_TESTS}${NC}"
echo -e "${RED}失败: ${FAILED_TESTS}${NC}"
echo -e "${YELLOW}=================================================${NC}\n"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}部分测试失败！${NC}"
  exit 1
fi
