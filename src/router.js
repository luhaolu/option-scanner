import Vue from "vue";
import Router from "vue-router";
import OptionScanner from './components/OptionScanner.vue';

Vue.use(Router);

let router = new Router({
    mode: "history",
    routes: [
        {
            path: "",
            component: OptionScanner,
        },
    ],
});

export default router
