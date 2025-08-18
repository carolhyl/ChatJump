<template>
  <div 
    :class="['svg-icon', className]"
    :style="{ width: size + 'px', height: size + 'px', color: iconColor }"
    v-html="svgContent"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: 24
  },
  color: {
    type: String,
    default: 'currentColor'
  },
  className: {
    type: String,
    default: ''
  }
})

const svgContent = ref('')

const iconColor = computed(() => {
  // 如果是 chat-jump 圖標且沒有指定顏色，使用漸層
  if (props.name === 'chat-jump' && props.color === 'currentColor') {
    return null // 讓 SVG 使用內建的漸層
  }
  return props.color
})

// 載入 SVG 檔案
const loadSvg = async () => {
  try {
    const response = await fetch(`/src/svg/${props.name}.svg`)
    if (response.ok) {
      let svg = await response.text()
      
      // 如果是 chat-jump 圖標且需要漸層效果
      if (props.name === 'chat-jump' && props.color === 'currentColor') {
        const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`
        svg = svg.replace('fill="currentColor"', `fill="url(#${gradientId})"`)
        svg = svg.replace('</svg>', `
          <defs>
            <linearGradient id="${gradientId}" x1="24.4031" y1="25.1309" x2="7.68258" y2="0.824196" gradientUnits="userSpaceOnUse">
              <stop stop-color="#ED8742"/>
              <stop offset="1" stop-color="#FDBD6F"/>
            </linearGradient>
          </defs>
        </svg>`)
      }
      
      // 設置 SVG 尺寸
      svg = svg.replace(/width="\d+"/, `width="${props.size}"`)
      svg = svg.replace(/height="\d+"/, `height="${props.size}"`)
      
      svgContent.value = svg
    } else {
      console.warn(`SVG icon "${props.name}" not found`)
      svgContent.value = `<div style="width:${props.size}px;height:${props.size}px;background:#ddd;border-radius:4px;"></div>`
    }
  } catch (error) {
    console.error(`Error loading SVG icon "${props.name}":`, error)
    svgContent.value = `<div style="width:${props.size}px;height:${props.size}px;background:#ddd;border-radius:4px;"></div>`
  }
}

// 監聽 props 變化，重新載入 SVG
watch([() => props.name, () => props.size, () => props.color], loadSvg, { immediate: true })

onMounted(() => {
  loadSvg()
})
</script>

<style scoped>
.svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.svg-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
