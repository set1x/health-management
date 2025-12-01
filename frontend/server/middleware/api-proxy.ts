import type { H3Event } from 'h3'
import { proxyRequest, getProxyRequestHeaders } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const path = event.node.req.url || '/'

  if (!path.startsWith('/api')) {
    return
  }
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBase as string
  const backendPathWithQuery = path.replace(/^\/api/, '') || '/'

  const normalizedPath = backendPathWithQuery.startsWith('/')
    ? backendPathWithQuery
    : `/${backendPathWithQuery}`

  const target = new URL(normalizedPath, apiBaseUrl).toString()
  const proxyHeaders = getProxyRequestHeaders(event)

  return proxyRequest(event, target, {
    headers: proxyHeaders
  })
})
