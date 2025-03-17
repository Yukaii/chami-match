<script setup>
import { computed, onMounted, ref } from 'vue';
import { useGameStore } from '../stores/game';

const store = useGameStore();
const sliderH = ref(0);
const sliderS = ref(0);
const sliderV = ref(0);
const colorSpace = computed(() => store.colorSpace);

// Initialize the game if not already started
onMounted(() => {
  if (!store.currentSession) {
    store.startOver();
  }
});

// Update the user color based on HSV sliders
const updateColor = () => {
  store.updateUserColor(sliderH.value, sliderS.value, sliderV.value);
};

// Check the current guess
const submit = () => {
  store.checkGuess();
};

// Handle keyboard shortcuts
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    submit();
  }
};

// Sync sliders with game state
const syncUserColor = () => {
  if (store.userColor) {
    if (colorSpace.value === 'hsv') {
      sliderH.value = store.userColor.h || 0;
      sliderS.value = store.userColor.s || 0;
      sliderV.value = store.userColor.v || 0;
    } else if (colorSpace.value === 'rgb') {
      sliderH.value = store.userColor.r || 0;
      sliderS.value = store.userColor.g || 0;
      sliderV.value = store.userColor.b || 0;
    } else if (colorSpace.value === 'oklab') {
      sliderH.value = store.userColor.L || 0;
      sliderS.value = store.userColor.a || 0;
      sliderV.value = store.userColor.b || 0;
    }
  }
};

// Return to home screen
const goHome = () => {
  navigateTo('/');
};
</script>

<template>
  <div class="game-screen flex h-full flex-col" @keydown="handleKeyDown">
    <!-- Game Navigation Bar -->
    <div class="game-nav-bar bg-gray-200 dark:bg-gray-800 p-4 flex justify-between items-center">
      <button @click="goHome" class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7m-14 0l2 2m0 0l7 7 7-7" />
        </svg>
      </button>
      
      <!-- Game Stats -->
      <div class="flex space-x-4 text-sm">
        <div>{{ $t('roundCount') }}: {{ store.currentRound }}</div>
        <div>{{ $t('winningRate') }}: {{ store.winRate }}</div>
      </div>
      
      <!-- Game Controls -->
      <div class="flex space-x-2">
        <button @click="store.toggleRecordPopup()" class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>
        <button @click="store.toggleSettingsPopup()" class="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Game Content -->
    <div class="game-content flex-grow flex flex-col p-4 bg-gray-100 dark:bg-gray-900">
      <!-- Health Bar -->
      <div class="health-bar mb-4">
        <div class="flex items-center">
          <span class="text-sm font-medium mr-2">{{ $t('lives') }}</span>
          <div class="flex space-x-1">
            <div 
              v-for="i in store.maxLife" 
              :key="i" 
              :class="[
                'h-4 w-4 rounded-full',
                i <= store.lives ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
              ]"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Color Display Area -->
      <div class="color-display flex justify-center mb-8">
        <div class="flex space-x-8">
          <!-- Target Color -->
          <div class="flex flex-col items-center">
            <div 
              class="w-28 h-28 rounded-lg shadow-lg" 
              :style="{
                backgroundColor: store.randomColor ? 
                  colorSpace === 'hsv' ? `hsl(${store.randomColor.h}, ${store.randomColor.s}%, ${store.randomColor.v}%)` :
                  colorSpace === 'rgb' ? `rgb(${store.randomColor.r}, ${store.randomColor.g}, ${store.randomColor.b})` :
                  `rgb(0, 0, 0)` // Default fallback
                : 'transparent'
              }"
            ></div>
            <span class="mt-2 text-sm font-medium">{{ $t('precisionTarget') }}</span>
          </div>
          
          <!-- User Color -->
          <div class="flex flex-col items-center">
            <div 
              class="w-28 h-28 rounded-lg shadow-lg" 
              :style="{
                backgroundColor: store.userColor ? 
                  colorSpace === 'hsv' ? `hsl(${store.userColor.h}, ${store.userColor.s}%, ${store.userColor.v}%)` :
                  colorSpace === 'rgb' ? `rgb(${store.userColor.r}, ${store.userColor.g}, ${store.userColor.b})` :
                  `rgb(0, 0, 0)` // Default fallback
                : 'transparent'
              }"
            ></div>
            <span class="mt-2 text-sm font-medium">{{ $t('yourGuess') }}</span>
          </div>
        </div>
      </div>
      
      <!-- Color Adjustment Controls -->
      <div class="color-controls bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div v-if="colorSpace === 'hsv'" class="space-y-4">
          <!-- HSV Sliders -->
          <div class="slider-group">
            <label class="block mb-1 text-sm font-medium">Hue ({{ sliderH }})</label>
            <input 
              type="range" 
              min="0" 
              max="360" 
              v-model.number="sliderH"
              @input="updateColor"
              class="w-full h-2 rounded appearance-none cursor-pointer"
            >
          </div>
          
          <div class="slider-group">
            <label class="block mb-1 text-sm font-medium">Saturation ({{ sliderS }}%)</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              v-model.number="sliderS"
              @input="updateColor"
              class="w-full h-2 rounded appearance-none cursor-pointer"
            >
          </div>
          
          <div class="slider-group">
            <label class="block mb-1 text-sm font-medium">Value ({{ sliderV }}%)</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              v-model.number="sliderV"
              @input="updateColor"
              class="w-full h-2 rounded appearance-none cursor-pointer"
            >
          </div>
        </div>
        
        <div v-else-if="colorSpace === 'rgb'" class="space-y-4">
          <!-- RGB Sliders -->
          <div class="slider-group">
            <label class="block mb-1 text-sm font-medium">Red ({{ sliderH }})</label>
            <input 
              type="range" 
              min="0" 
              max="255" 
              v-model.number="sliderH"
              @input="updateColor"
              class="w-full h-2 rounded appearance-none cursor-pointer"
            >
          </div>
          
          <div class="slider-group">
            <label class="block mb-1 text-sm font-medium">Green ({{ sliderS }})</label>
            <input 
              type="range" 
              min="0" 
              max="255" 
              v-model.number="sliderS"
              @input="updateColor"
              class="w-full h-2 rounded appearance-none cursor-pointer"
            >
          </div>
          
          <div class="slider-group">
            <label class="block mb-1 text-sm font-medium">Blue ({{ sliderV }})</label>
            <input 
              type="range" 
              min="0" 
              max="255" 
              v-model.number="sliderV"
              @input="updateColor"
              class="w-full h-2 rounded appearance-none cursor-pointer"
            >
          </div>
        </div>
        
        <!-- Submit Button -->
        <div class="mt-4">
          <UiButton variant="success" full-width @click="submit">
            {{ $t('submit') }}
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="range"] {
  -webkit-appearance: none;
  background: linear-gradient(to right, #ffc0cb 0%, #ff0000 17%, #ffff00 33%, #00ff00 50%, #00ffff 67%, #0000ff 83%, #ff00ff 100%);
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #777;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #777;
  cursor: pointer;
}

/* Override for saturation and value sliders */
.slider-group:nth-child(2) input[type="range"],
.slider-group:nth-child(3) input[type="range"] {
  background: linear-gradient(to right, #ccc 0%, #666 100%);
}

/* Override for RGB sliders */
.slider-group:nth-child(1) input[type="range"]:has(+ label:contains('Red')) {
  background: linear-gradient(to right, #000 0%, #f00 100%);
}

.slider-group:nth-child(2) input[type="range"]:has(+ label:contains('Green')) {
  background: linear-gradient(to right, #000 0%, #0f0 100%);
}

.slider-group:nth-child(3) input[type="range"]:has(+ label:contains('Blue')) {
  background: linear-gradient(to right, #000 0%, #00f 100%);
}
</style>