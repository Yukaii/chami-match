import { createHead } from "@unhead/vue";
import { createApp } from "vue";
import VueGtag from "vue-gtag";
import { createPinia } from 'pinia';
import { initializeStores } from './stores';

import "./style.css";
import App from "./App.vue";
import i18n from "./internationalization/index";
import router from "./router";

const head = createHead();

const app = createApp(App);

app
	.use(i18n)
	.use(head)
	.use(router)
	.use(createPinia())
	.use(
		VueGtag,
		{
			appName: "Chami Match",
			pageTrackerScreenviewEnabled: true,
			config: { id: import.meta.env.VITE_GA_MEASUREMENT_ID },
		},
		router,
	);

// Initialize all stores that need initialization
initializeStores();

app.mount("#app");
