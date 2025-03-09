import { createHead } from "@unhead/vue";
import { createApp } from "vue";
import VueGtag from "vue-gtag";

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
	.use(
		VueGtag,
		{
      appName: 'Chami Match',
      pageTrackerScreenviewEnabled: true,
			config: { id: import.meta.env.GA_MEASUREMENT_ID },
		},
		router,
	);

app.mount("#app");
