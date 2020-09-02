import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import mixins from './mixins'
import viewDesign from 'view-design'
import 'view-design/dist/styles/iview.css'

Vue.use(viewDesign)
Vue.mixin(mixins)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
