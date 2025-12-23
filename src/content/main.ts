import { createApp } from 'vue'
import store from '@/store'
import App from './views/App.vue'
import "../style.css";
import "@/assets/iconfont.css"
import 'vue-sonner/style.css'

/**
 * Mount the Vue app to the DOM.
 */
function mountApp() {
  const container = document.createElement('div')
  container.id = 'crxjs-app'
  document.body.appendChild(container)
  const app = createApp(App).use(store)
  app.mount(container)
}

mountApp()
