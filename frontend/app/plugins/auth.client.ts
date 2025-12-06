/**
 * 认证插件
 */
export default defineNuxtPlugin(() => {
  const { fetchUserProfile, logout } = useAuth()
  const token = useCookie('token')
  const router = useRouter()

  const userState = useState<User | null>('user', () => null)

  // 尝试恢复用户信息缓存
  if (import.meta.client && token.value && !userState.value) {
    try {
      const cachedUser = localStorage.getItem('user_cache')
      const cacheTimestamp = localStorage.getItem('user_cache_timestamp')

      if (cachedUser && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp)
        // 缓存有效期 5 分钟
        if (cacheAge < 5 * 60 * 1000) {
          const parsedUser = JSON.parse(cachedUser)
          userState.value = parsedUser
        }
      }
    } catch {
      // 忽略加载错误
    }
  }

  // 路由守卫：在导航前验证 token，避免闪屏
  router.beforeEach(async (to) => {
    const publicRoutes = ['/login', '/register', '/']

    if (publicRoutes.includes(to.path)) {
      return
    }

    // 没有 token，重定向到登录页
    if (!token.value) {
      return navigateTo('/login')
    }

    // 有 token 但没有用户信息，需要验证（阻塞导航）
    if (!userState.value) {
      const isValid = await fetchUserProfile(true)
      if (!isValid) {
        logout(true)
        return navigateTo('/login')
      }
    }
  })
})
