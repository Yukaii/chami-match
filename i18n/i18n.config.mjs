import en from "./locales/en.json";
import ja from "./locales/ja.json";
import zhTW from "./locales/zh-TW.json";


export default defineI18nConfig({
	locale: "en",
	fallbackLocale: "en",
	legacy: false,
	globalInjection: true,
	messages: {
		"zh-TW": zhTW,
		en,
		ja,
	},
});
