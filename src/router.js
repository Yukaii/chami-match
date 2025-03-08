import { createRouter, createWebHistory } from 'vue-router'
import WelcomeScreen from './components/WelcomeScreen.vue'
import GameScreen from './components/GameScreen.vue'
import ContextGameScreen from './components/ContextGameScreen.vue'
import RelativeGameScreen from './components/RelativeGameScreen.vue'

const routes = [
  {
    path: '/',
    component: WelcomeScreen
  },
  {
    path: '/game',
    component: GameScreen
  },
  {
    path: '/context-game',
    component: ContextGameScreen
  },
  {
    path: '/relative-game',
    component: RelativeGameScreen
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
