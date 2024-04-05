<template>
    <div :class="popupClassName" @click="onClose">
        <div class="w-9/10 max-w-xs bg-[#1f2937] rounded-md p-4 z-50" @click.stop="">
            <div class="text-white text-lg mb-4">遊戲記錄</div>
            <div class="space-y-2">
                <!-- Record Items -->
                <div class="bg-gray-800 p-2 rounded-lg flex justify-between items-center">
                    <div class="flex space-x-2">
                        <div class="w-8 h-8 rounded-lg" style="background-color: #a83279;"></div>
                        <div class="w-8 h-8 rounded-lg" style="background-color: #32a852;"></div>
                    </div>
                    <div>
                        <span class="text-orange-300">H: 160 (7)</span>
                        <span class="text-orange-300">S: 50 (5)</span>
                        <span class="text-orange-300">V: 40 (4)</span>
                    </div>
                </div>
                <div class="bg-gray-800 p-2 rounded-lg flex justify-between items-center">
                    <div class="flex space-x-2">
                        <div class="w-8 h-8 rounded-lg" style="background-color: #a8a832;"></div>
                        <div class="w-8 h-8 rounded-lg" style="background-color: #3278a8;"></div>
                    </div>
                    <div>
                        <span class="text-orange-300">H: 130 (6)</span>
                        <span class="text-orange-300">S: 40 (4)</span>
                        <span class="text-orange-300">V: 30 (3)</span>
                    </div>
                </div>
            </div>
            <button class="bg-pink-600 px-4 py-2 rounded-lg text-white w-full mt-4 button-3d" @click="onClose">關閉</button>
        </div>
    </div>
</template>

<script setup>
import { twMerge } from 'tailwind-merge'
import { useGlobalGameState } from '../gameState'

const state = useGlobalGameState()
const recordPopupOpen = state.recordPopupOpen

const popupClassName = computed(() => {
  return twMerge('fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-50', !recordPopupOpen.value && 'hidden')
})

const onClose = () => {
  state.toggleRecordPopup(false)
}
</script>
