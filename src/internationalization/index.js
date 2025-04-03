import { createI18n } from "vue-i18n";

import en from "./languages/en.json";
import ja from "./languages/ja.json";
import zhTW from "./languages/zh-TW.json";

const availableCodes = ["en", "zh-TW", "ja"];

const languageCode =
  localStorage.getItem("lang") || navigator.language || "zh-TW";

const i18n = createI18n({
  locale: availableCodes.includes(languageCode) ? languageCode : "zh-TW",
  fallbackLocale: "zh-TW",
  legacy: false,
  globalInjection: true,
  messages: {
    "zh-TW": zhTW,
    en,
    ja,
  },
});

export default i18n;
