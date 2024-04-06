import { createApp } from 'vue'
import { createHead } from '@unhead/vue'

import './style.css'
import App from './App.vue'
import i18n from './internationalization/index'

const head = createHead()

createApp(App).use(i18n).use(head).mount('#app')
