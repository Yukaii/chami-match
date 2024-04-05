import { createI18n } from 'vue-i18n'

import en from './languages/en.json'
import zhTW from './languages/zh-TW.json'

const i18n = createI18n({
  locale: localStorage.getItem('lang') || 'zh-TW',
  fallbackLocale: 'zh-TW',
  legacy: false,
  globalInjection: true,
  messages: {
    'zh-TW': zhTW,
    en,
  },
})

export default i18n
