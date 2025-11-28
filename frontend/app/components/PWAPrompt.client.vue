<script setup lang="ts">
const { $pwa } = useNuxtApp()

const offlineReady = computed(() => $pwa?.offlineReady ?? false)
const needRefresh = computed(() => $pwa?.needRefresh ?? false)
const showInstallPrompt = computed(() => $pwa?.showInstallPrompt ?? false)

const toast = useToast()

async function updateServiceWorker() {
  await $pwa?.updateServiceWorker()
}

function close() {
  $pwa?.cancelPrompt()
}

async function install() {
  await $pwa?.install()
}

function cancelInstall() {
  $pwa?.cancelInstall()
}

// 显示更新提示
watch(needRefresh, (val) => {
  if (val) {
    toast.add({
      id: 'pwa-update',
      title: '发现新版本',
      description: '新内容可用，点击立即更新',
      color: 'info',
      icon: 'i-lucide-download',
      duration: 0,
      actions: [
        {
          label: '立即更新',
          color: 'primary',
          onClick: updateServiceWorker
        },
        {
          label: '稍后',
          onClick: close
        }
      ]
    })
  }
})

// 显示离线就绪提示
watch(offlineReady, (val) => {
  if (val) {
    toast.add({
      id: 'pwa-offline',
      title: '离线可用',
      description: '应用已准备好在离线状态下使用',
      color: 'success',
      icon: 'i-lucide-wifi-off',
      duration: 3000
    })
  }
})
</script>

<template>
  <!-- PWA 安装提示横幅 -->
  <div
    v-if="showInstallPrompt"
    class="fixed right-4 bottom-4 left-4 z-50 rounded-lg border border-gray-200 bg-white p-4 shadow-lg md:right-4 md:left-auto md:w-96 dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="flex items-start gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900"
      >
        <UIcon name="i-lucide-download" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">安装应用</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">安装到桌面，获得更好的体验</p>
        <div class="mt-3 flex gap-2">
          <UButton size="sm" @click="install"> 安装 </UButton>
          <UButton variant="ghost" size="sm" @click="cancelInstall"> 暂不需要 </UButton>
        </div>
      </div>
      <UButton
        variant="ghost"
        icon="i-lucide-x"
        size="xs"
        class="shrink-0"
        @click="cancelInstall"
      />
    </div>
  </div>
</template>
