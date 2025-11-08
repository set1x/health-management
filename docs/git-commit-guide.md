# Git 提交规范

## 提交格式

```
类型: 描述信息
```

## 类型说明

- **feat**: 新增功能
- **fix**: 修复 Bug
- **docs**: 文档更新
- **style**: 代码格式调整（不影响功能）
- **refactor**: 代码重构
- **perf**: 性能优化
- **test**: 测试相关
- **chore**: 构建/工具链变动

## 示例

### 基本提交

```bash
git commit -m "feat: 新增用户登录功能"
git commit -m "fix: 修复体重数据删除问题"
git commit -m "docs: 更新 README"
git commit -m "style: 调整仪表板布局"
git commit -m "refactor: 重构数据查询接口"
git commit -m "perf: 优化图表渲染性能"
git commit -m "test: 添加饮食记录测试"
git commit -m "chore: 升级 Nuxt 版本"
```

### 详细提交

当需要更多说明时，可添加详细描述：

```bash
git commit -m "feat: 新增 AI 流式对话功能

- 实现 SSE 实时通信
- 支持 Markdown 格式化
- 添加上下文记忆
- 优化聊天历史持久化"
```

## 编写规则

1. 描述使用中文
2. 简洁明确，说明做了什么
3. 一行最多 100 个字符
4. 详细描述每行不超过 72 个字符

## 最佳实践

- **原子提交**：一次提交只做一件事
- **及时提交**：完成功能点就提交
- **清晰描述**：让他人快速理解改动
- 避免模糊描述如"修复 bug"、"更新代码"
