// https://nuxt.com/docs/api/configuration/nuxt-config

const apiBaseUrl = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/icon', '@nuxt/ui', '@vite-pwa/nuxt'],

  components: [
    {
      path: '~/components',
      pathPrefix: false // 不使用文件夹名作为组件名前缀
    }
  ],

  imports: {
    dirs: [
      // 默认已包含: composables/**, utils/**
      'types'
    ]
  },

  devtools: {
    enabled: true
  },

  app: {
    head: {
      title: '健康生活管理系统',
      htmlAttrs: {
        lang: 'zh-CN'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '健康生活管理系统 - 您的健康小助手' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', href: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBase: apiBaseUrl
    }
  },

  routeRules: {
    // 公开页面 - 预渲染
    '/': { prerender: true },
    '/login': { prerender: true },

    // 管理后台页面 - 客户端渲染
    '/dashboard': { ssr: false },
    '/chat': { ssr: false },
    '/body-data': { ssr: false },
    '/diet': { ssr: false },
    '/exercise': { ssr: false },
    '/sleep': { ssr: false },
    '/profile': { ssr: false }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    devProxy: {
      '/api': {
        target: apiBaseUrl,
        changeOrigin: true,
        secure: false
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    provider: 'iconify',
    serverBundle: 'auto',
    clientBundle: {
      scan: true,
      sizeLimitKb: 512
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '健康生活管理系统',
      short_name: '健康助手',
      description: '健康生活管理系统 - 您的健康小助手',
      theme_color: '#037BFE',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      lang: 'zh-CN',
      icons: [
        {
          src: 'pwa-64x64.png',
          sizes: '64x64',
          type: 'image/png'
        },
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      navigateFallback: null,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\.bye-bye\.icu\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 // 24 hours
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: false,
      type: 'module'
    }
  }
})
