export default defineNuxtRouteMiddleware((to) => {
  // 仅在客户端执行认证检查
  // 因为受保护的路由都是 CSR，不会在服务端渲染
  if (import.meta.server) return

  const config = useRuntimeConfig().public
  if (config.SKIP_AUTH === 'true') return

  const token = useCookie('token')
  const publicRoutes = ['/login', '/register', '/']

  if (!token.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
