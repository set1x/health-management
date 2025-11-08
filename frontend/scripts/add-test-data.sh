#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

if [ -f .env.test ]; then
  export $(cat .env.test | grep -v '^#' | xargs)
fi

API_BASE=${API_TARGET:-"http://localhost:8080"}
USER_ID=${TEST_USER_ID}
TOKEN=${TEST_TOKEN}

# 默认生成 20 条记录
COUNT=${1:-20}

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}批量添加测试数据${NC}"
echo -e "${CYAN}========================================${NC}\n"

# 统计变量
BODY_SUCCESS=0
BODY_FAILED=0
DIET_SUCCESS=0
DIET_FAILED=0
EXERCISE_SUCCESS=0
EXERCISE_FAILED=0

# 食物列表（早餐/午餐/晚餐/加餐）
BREAKFAST_FOODS=("牛奶" "鸡蛋" "面包" "粥" "豆浆" "油条" "煎饼" "包子")
BREAKFAST_CALORIES=(150 80 120 100 90 280 320 220)

LUNCH_FOODS=("米饭" "面条" "炒菜" "鱼肉" "鸡肉" "牛肉" "豆腐" "汤")
LUNCH_CALORIES=(250 300 180 220 200 280 150 50)

DINNER_FOODS=("米饭" "粥" "炒菜" "鱼肉" "鸡肉" "蔬菜" "水果" "汤")
DINNER_CALORIES=(200 100 180 220 200 80 60 50)

SNACK_FOODS=("水果" "坚果" "酸奶" "饼干" "巧克力" "蛋糕" "薯片" "糖果")
SNACK_CALORIES=(60 180 120 150 200 350 250 100)

# 运动类型列表
EXERCISE_TYPES=("跑步" "游泳" "骑行" "瑜伽" "篮球" "足球" "羽毛球" "健身")
EXERCISE_DURATIONS=(30 45 60 40 50 60 40 45)
EXERCISE_CALORIES=(300 400 350 200 400 450 300 350)

echo -e "${YELLOW}开始生成 ${COUNT} 组测试数据...${NC}\n"

for i in $(seq 1 $COUNT); do
  # 计算日期（从今天往前推）
  DAYS_AGO=$((i - 1))
  RECORD_DATE=$(date -d "-${DAYS_AGO} days" +%Y-%m-%d)

  echo -e "${CYAN}[${i}/${COUNT}] 日期: ${RECORD_DATE}${NC}"

  # ==================== 1. 添加身体数据 ====================
  HEIGHT=$(awk -v min=165 -v max=180 'BEGIN{srand(); print min+rand()*(max-min)}')
  WEIGHT=$(awk -v min=55 -v max=85 'BEGIN{srand(); print min+rand()*(max-min)}')

  BODY_DATA=$(cat <<EOF
{
  "userID": "${USER_ID}",
  "heightCM": ${HEIGHT},
  "weightKG": ${WEIGHT},
  "recordDate": "${RECORD_DATE}"
}
EOF
)

  RESPONSE=$(curl -s -X POST "${API_BASE}/body-metrics" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$BODY_DATA")

  if echo "$RESPONSE" | jq -e '.code == 1' > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ 身体数据: ${HEIGHT%.??} cm, ${WEIGHT%.??} kg${NC}"
    BODY_SUCCESS=$((BODY_SUCCESS + 1))
  else
    echo -e "  ${RED}✗ 身体数据添加失败${NC}"
    BODY_FAILED=$((BODY_FAILED + 1))
  fi

  # ==================== 2. 添加饮食数据（每天 3-5 条）====================
  MEAL_COUNT=$((3 + RANDOM % 3))

  for j in $(seq 1 $MEAL_COUNT); do
    case $j in
      1)
        MEAL_TYPE="早餐"
        FOOD_INDEX=$((RANDOM % ${#BREAKFAST_FOODS[@]}))
        FOOD_NAME="${BREAKFAST_FOODS[$FOOD_INDEX]}"
        CALORIES="${BREAKFAST_CALORIES[$FOOD_INDEX]}"
        ;;
      2)
        MEAL_TYPE="午餐"
        FOOD_INDEX=$((RANDOM % ${#LUNCH_FOODS[@]}))
        FOOD_NAME="${LUNCH_FOODS[$FOOD_INDEX]}"
        CALORIES="${LUNCH_CALORIES[$FOOD_INDEX]}"
        ;;
      3)
        MEAL_TYPE="晚餐"
        FOOD_INDEX=$((RANDOM % ${#DINNER_FOODS[@]}))
        FOOD_NAME="${DINNER_FOODS[$FOOD_INDEX]}"
        CALORIES="${DINNER_CALORIES[$FOOD_INDEX]}"
        ;;
      *)
        MEAL_TYPE="加餐"
        FOOD_INDEX=$((RANDOM % ${#SNACK_FOODS[@]}))
        FOOD_NAME="${SNACK_FOODS[$FOOD_INDEX]}"
        CALORIES="${SNACK_CALORIES[$FOOD_INDEX]}"
        ;;
    esac

    DIET_DATA=$(cat <<EOF
{
  "userID": "${USER_ID}",
  "mealType": "${MEAL_TYPE}",
  "foodName": "${FOOD_NAME}",
  "estimatedCalories": ${CALORIES},
  "recordDate": "${RECORD_DATE}"
}
EOF
)

    RESPONSE=$(curl -s -X POST "${API_BASE}/diet-items" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$DIET_DATA")

    if echo "$RESPONSE" | jq -e '.code == 1' > /dev/null 2>&1; then
      echo -e "  ${GREEN}✓ 饮食: ${MEAL_TYPE} - ${FOOD_NAME} (${CALORIES} kcal)${NC}"
      DIET_SUCCESS=$((DIET_SUCCESS + 1))
    else
      echo -e "  ${RED}✗ 饮食数据添加失败${NC}"
      DIET_FAILED=$((DIET_FAILED + 1))
    fi
  done

  # ==================== 3. 添加运动数据（每天 1-2 条）====================
  EXERCISE_COUNT=$((1 + RANDOM % 2))

  for k in $(seq 1 $EXERCISE_COUNT); do
    EX_INDEX=$((RANDOM % ${#EXERCISE_TYPES[@]}))
    EX_TYPE="${EXERCISE_TYPES[$EX_INDEX]}"
    EX_DURATION="${EXERCISE_DURATIONS[$EX_INDEX]}"
    EX_CALORIES="${EXERCISE_CALORIES[$EX_INDEX]}"

    EXERCISE_DATA=$(cat <<EOF
{
  "userID": "${USER_ID}",
  "exerciseType": "${EX_TYPE}",
  "durationMinutes": ${EX_DURATION},
  "estimatedCaloriesBurned": ${EX_CALORIES},
  "recordDate": "${RECORD_DATE}"
}
EOF
)

    RESPONSE=$(curl -s -X POST "${API_BASE}/exercise-items" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$EXERCISE_DATA")

    if echo "$RESPONSE" | jq -e '.code == 1' > /dev/null 2>&1; then
      echo -e "  ${GREEN}✓ 运动: ${EX_TYPE} (${EX_DURATION} 分钟, 消耗 ${EX_CALORIES} kcal)${NC}"
      EXERCISE_SUCCESS=$((EXERCISE_SUCCESS + 1))
    else
      echo -e "  ${RED}✗ 运动数据添加失败${NC}"
      EXERCISE_FAILED=$((EXERCISE_FAILED + 1))
    fi
  done

  echo ""

  # 避免请求过快
  sleep 0.1
done

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}数据添加完成${NC}"
echo -e "${CYAN}========================================${NC}\n"

echo -e "${YELLOW}统计摘要:${NC}"
echo -e "  身体数据: ${GREEN}成功 ${BODY_SUCCESS}${NC} / ${RED}失败 ${BODY_FAILED}${NC}"
echo -e "  饮食记录: ${GREEN}成功 ${DIET_SUCCESS}${NC} / ${RED}失败 ${DIET_FAILED}${NC}"
echo -e "  运动记录: ${GREEN}成功 ${EXERCISE_SUCCESS}${NC} / ${RED}失败 ${EXERCISE_FAILED}${NC}"

TOTAL_SUCCESS=$((BODY_SUCCESS + DIET_SUCCESS + EXERCISE_SUCCESS))
TOTAL_FAILED=$((BODY_FAILED + DIET_FAILED + EXERCISE_FAILED))

echo -e "\n${YELLOW}总计: ${GREEN}${TOTAL_SUCCESS} 条成功${NC} / ${RED}${TOTAL_FAILED} 条失败${NC}\n"

if [ $TOTAL_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ 所有数据添加成功！${NC}"
  exit 0
else
  echo -e "${RED}✗ 部分数据添加失败${NC}"
  exit 1
fi
