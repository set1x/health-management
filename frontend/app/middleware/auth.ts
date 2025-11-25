export default defineNuxtRouteMiddleware((to) => {
  // 仅在客户端执行认证检查
  if (import.meta.server) return

  const config = useRuntimeConfig().public
  if (config.SKIP_AUTH === 'true') return

  const token = useCookie('token')
  const userID = useCookie('userID')
  const publicRoutes = ['/login', '/register']

  // 如果是公开路由
  if (publicRoutes.includes(to.path)) {
    // 已登录用户访问公开路由，重定向到 dashboard
    if (token.value && userID.value) {
      return navigateTo('/dashboard')
    }
    return
  }

  // 如果访问首页
  if (to.path === '/') {
    // 已登录用户直接跳转到 dashboard，否则跳转到登录页
    if (token.value && userID.value) {
      return navigateTo('/dashboard')
    }
    return navigateTo('/login')
  }

  // 如果没有 token 或 userID，跳转到登录页
  if (!token.value || !userID.value) {
    return navigateTo('/login')
  }

  // token 有效性验证由 auth.client.ts 插件在应用初始化时处理
})
