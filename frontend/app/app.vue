<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage
        :transition="{
          name: 'page',
          mode: 'out-in'
        }"
      />
    </NuxtLayout>
    <PWAPrompt />
  </UApp>
</template>
