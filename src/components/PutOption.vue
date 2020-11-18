<template>
  <div>
    <!-- TradingView Widget BEGIN -->
    <VueTradingView v-bind:options="{
      autosize: true,
      symbol: 'AMD',
      interval: 'D',
      timezone: 'America/New_York',
      theme: 'light',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      allow_symbol_change: true,
      range: 'YTD',
      hide_side_toolbar: false,
    }" />
    <!-- TradingView Widget END -->
    <b-card no-body border-variant="light" class="text-center">
      <b-input-group size="md" prepend="Symbol(s)">
        <b-form-input v-model="symbols" v-on:keyup.enter="onSearch"></b-form-input>
        <b-button variant="info" @click="onSearch">
          Search
        </b-button>
      </b-input-group>
      <b-overlay :show="isLoading" rounded="sm" spinner-variant="primary" spinner-type="grow" spinner>
        <b-table striped hover :items="options" :fields="fields" :sort-by.sync="sortBy" :sort-desc.sync="sortDesc"></b-table>
      </b-overlay>
    </b-card>
  </div>
</template>

<script>
import {getAccesToken, getCashSecuredPuts} from "../services/LivevolService";
import VueTradingView from 'vue-trading-view';

export default {
  name: 'PutOption',
  props: {
    msg: String
  },
  components: {
    VueTradingView,
  },
  data: function () {
    return {
      symbols: "",
      isLoading: false,
      options: [],
      sortBy: "annualized_%",
      sortDesc: true,
      fields: [
        {
          key: 'symbol',
          sortable: true
        },
        {
          key: 'stock_price',
          sortable: true
        },
        {
          key: 'strike',
          sortable: true
        },
        {
          key: 'bid',
          sortable: true
        },
        {
          key: 'expiry',
          sortable: true
        },
        {
          key: 'drop_%',
          sortable: true
        },
        {
          key: 'DTE',
          sortable: true
        },
        {
          key: 'annualized_%',
          sortable: true,
          sortDirection: 'desc'
        },
      ],
    }
  },
  created  () {
  },
  computed: {
  },
  methods: {
    dte(option) {
      return Math.round((Date.parse(option.expiry) - Date.parse("2019-01-28"))/(1000*60*60*24));
    },
    annualized(option) {
      return Math.round(option?.option_bid * 365 / (this.dte(option) * option?.stock_price) * 100);
    },
    async onSearch() {
      try {
        this.isLoading = true;
        this.options = [];
        const response = await getAccesToken("therealhaolu@gmail.com_api_client_1603387975", "eddfdb7dbac1400fa80df14409e6256a");
        const symbolsResponse = await getCashSecuredPuts(response.data.access_token, this.symbols);
        let data = symbolsResponse.data.output;
        // console.log(response);

        data = data.filter((opt) => (Date.parse(opt.expiry) - Date.parse("2019-01-28")) /(1000*60*60*24) <= 14);
        // console.log(data);
        data.forEach((option) => {
          this.options.push({
            "symbol": option.symbol,
            "stock_price": option.stock_price,
            "strike": option.strike,
            "bid": option.option_bid,
            "expiry": option.expiry,
            "drop_%": option.out_of_the_money_percent,
            "DTE": this.dte(option),
            "annualized_%": this.annualized(option)
          })
        })
      } catch (error) {
          console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  #vue-trading-view {
    height: 30rem;
  }
  .scanner{
    margin-top: 0.5rem;
  }
</style>
