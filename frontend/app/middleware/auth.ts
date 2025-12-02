export default defineNuxtRouteMiddleware((to) => {
  // 仅在客户端执行认证检查
  if (import.meta.server) return

  const config = useRuntimeConfig().public
  if (config.SKIP_AUTH === 'true') return

  const token = useCookie('token')
  const userID = useCookie('userID')

  const isAuthenticated = computed(() => !!(token.value && userID.value))
  const publicRoutes = ['/login', '/register', '/']

  // 如果是公开路由且未登录，直接放行
  if (publicRoutes.includes(to.path) && !isAuthenticated.value) {
    return
  }

  // 已登录用户重定向到 dashboard
  if (publicRoutes.includes(to.path) && to.path !== '/' && isAuthenticated.value) {
    return navigateTo('/dashboard', { replace: true })
  }

  if (to.path === '/') {
    if (isAuthenticated.value) {
      return navigateTo('/dashboard', { replace: true })
    }
    return
  }

  if (!isAuthenticated.value) {
    return navigateTo('/login', { replace: true })
  }

  // token 有效性验证由 auth.client.ts 插件的路由守卫处理
})
