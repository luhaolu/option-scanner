import Vue from "vue";
import Router from "vue-router";
import PutOption from './components/PutOption.vue';
import OptionChain from './components/OptionChain.vue';

Vue.use(Router);

let router = new Router({
    mode: "history",
    routes: [
        {
            path: "PutOption",
            component: PutOption,
        },
        {
            path: "",
            component: OptionChain,
        },
    ],
});

export default router
