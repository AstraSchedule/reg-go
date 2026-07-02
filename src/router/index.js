import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Register',
      component: () => import('../views/Register.vue'),
    },
  ],
})

export default router
