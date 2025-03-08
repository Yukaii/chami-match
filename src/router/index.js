import { createRouter, createWebHistory } from "vue-router";
import GameScreen from "../components/GameScreen.vue";
import WelcomeScreen from "../components/WelcomeScreen.vue";

const routes = [
	{
		path: "/",
		name: "welcome",
		component: WelcomeScreen,
	},
	{
		path: "/game",
		name: "game",
		component: GameScreen,
	},
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;
