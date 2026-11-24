<template>
  <div class="not-found">
    <div class="card" style="text-align: center;">
      <h1>404</h1>
      <p style="margin: 20px 0;">页面不存在</p>
      <router-link to="/card" class="btn" style="display: inline-block; text-decoration: none;">
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  background: var(--app-bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>