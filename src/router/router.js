import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue' // ще създадем този компонент

const routes = [
  {
    path: '/users/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue') // примерен Home
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
