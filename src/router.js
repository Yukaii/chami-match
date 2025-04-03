import { createRouter, createWebHistory } from "vue-router";
import ContextGameScreen from "./components/ContextGameScreen.vue";
import GameScreen from "./components/GameScreen.vue";
import ImageGameScreen from "./components/ImageGameScreen.vue";
import RecallGameScreen from "./components/RecallGameScreen.vue";
import RelativeGameScreen from "./components/RelativeGameScreen.vue";
import WelcomeScreen from "./components/WelcomeScreen.vue";
// const ChallengePage = () => import("./pages/challenge/[id].vue"); // No longer needed

// Base routes that are always available
const routes = [
  {
    path: "/",
    component: WelcomeScreen,
  },
  {
    path: "/game",
    component: GameScreen,
  },
  {
    path: "/context-game",
    component: ContextGameScreen,
  },
  {
    path: "/relative-game",
    component: RelativeGameScreen,
  },
  {
    path: "/image-game",
    component: ImageGameScreen,
  },
  {
    path: "/recall-game",
    component: RecallGameScreen,
  },
  // { // Remove challenge page route
  // 	path: "/challenge/:id",
  // 	name: "ChallengeLeaderboard",
  // 	component: ChallengePage,
  // 	props: true,
  // },
];

// Add test error page route only in non-production environments
if (import.meta.env.MODE !== "production") {
  const TestErrorPage = () => import("./pages/TestErrorPage.vue");
  routes.push({
    path: "/test-error",
    component: TestErrorPage,
  });

  console.log("Test error page route added - available at /test-error");
}

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
