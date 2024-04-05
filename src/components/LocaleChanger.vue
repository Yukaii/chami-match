<script setup>
import { useI18n } from 'vue-i18n'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { PhGlobe } from '@phosphor-icons/vue'

const { locale } = useI18n()

const handleChangeLanguage = (value) => {
  locale.value = value
  localStorage.setItem('lang', value)
}
</script>

<template>
  <Menu as="button" class="button-3d relative rounded-lg bg-pink-600 p-2 text-white">
    <MenuButton class="flex">
      <ph-globe :size="20" />
    </MenuButton>

    <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
      <MenuItems
        class="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-lg bg-pink-600/5 shadow-lg ring-1 ring-black focus:outline-none">
        <div class="flex flex-col rounded bg-pink-600 py-1">
          <MenuItem><button class="hover:bg-pink-500" @click="handleChangeLanguage('zh-TW')">繁體中文</button></MenuItem>
          <MenuItem><button class="hover:bg-pink-500" @click="handleChangeLanguage('en')">English</button></MenuItem>
          <MenuItem><button class="hover:bg-pink-500" @click="handleChangeLanguage('ja')">日本語</button></MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>
