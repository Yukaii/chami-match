import { createApp } from 'vue'
import { createHead } from '@unhead/vue'

import './style.css'
import App from './App.vue'
import i18n from './internationalization/index'
import router from './router'

const head = createHead()

const app = createApp(App)

app.use(i18n).use(head).use(router)

app.mount('#app')
