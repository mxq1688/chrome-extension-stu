<template>
  <div class="loading-spinner" :class="{ small: size === 'small' }">
    <div class="spinner"></div>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'normal',
    validator: (value) => ['small', 'normal'].includes(value)
  },
  text: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-spinner.small {
  padding: 10px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.loading-text {
  margin-top: 12px;
  font-size: 13px;
  color: #6c757d;
  text-align: center;
}

.loading-spinner.small .loading-text {
  margin-top: 8px;
  font-size: 11px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>