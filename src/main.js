import Vue from "vue"

import App from "./App.vue"

import axios from "axios"
import yaml from "yaml"

import Vuikit from 'vuikit'
import VuikitIcons from '@vuikit/icons'
import '@vuikit/theme';

import VueHighlightJS from 'vue-highlightjs'

import router from './router'

Vue.use(Vuikit)
Vue.use(VuikitIcons)
Vue.use(VueHighlightJS)

Vue.config.productionTip = false

// default branch is master, but can overwrite with env
const branch = process.env.VUE_APP_TITAN_BRANCH || "master"
axios.defaults.headers.common['Authorization'] = `Bearer ${process.env.VUE_APP_GH_TOKEN}`;

new Vue({
  el: "#app",
  router: router,
  render: function(h) {
    return h(App, {
      props: {
        params: this.params,
        loading: this.loading,
        errored: this.errored
      }
    })
  },
  data: {
    params: {},
    loading: true,
    errored: false
  },
  mounted () {
    let url = `https://api.github.com/graphql`
    let query = {query: `
      query {
        repository(owner: "marshall-lab", name: "TITAN") {
          folder: object(expression: "${branch}:titan/params") {
            ... on Tree {
              entries {
                oid
                object {
                  ... on Blob {
                    text
                  }
                }
                name
              }
            }
          }
        }
        }
      `
    }

    axios
      .post(url, query)
      .then(response => {
        response.data.data.repository.folder.entries.map(val => {
          let name = val.name.split(".")[0]
          let param = yaml.parse(val.object.text)
          Vue.set(this.params, name, param[name])
        })
      })
      .catch(error => {
        console.log(error)
        this.errored = true
      })
      .finally(() => this.loading = false)
  }
});
