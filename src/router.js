import { createRouter, createWebHistory } from 'vue-router'
import WelcomeScreen from './components/WelcomeScreen.vue'
import GameScreen from './components/GameScreen.vue'
import ContextGameScreen from './components/ContextGameScreen.vue'
import RelativeGameScreen from './components/RelativeGameScreen.vue'

// Base routes that are always available
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

// Add test error page route only in non-production environments
if (import.meta.env.MODE !== 'production') {
  const TestErrorPage = () => import('./pages/TestErrorPage.vue')
  routes.push({
    path: '/test-error',
    component: TestErrorPage
  })

  console.log('Test error page route added - available at /test-error')
}

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
