<template>
  <b-container fluid="xl">
    <b-form-row>
      <!-- TradingView Widget BEGIN -->
      <!-- <b-col md="6">
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
      </b-col> -->
      <b-col md="12">
        <b-card no-body border-variant="light" class="text-center">
          <!-- <div>Searching {{numOfSearch}} Symbols</div>
          <div>Recived {{numOfResults}} Results</div> -->
          <div>{{uniqueSymbols.length}} Unique Symbols: {{uniqueSymbolsStr}}</div>
          <div v-if="durationInMin > 0">Scan took {{durationInMin}} mins </div>
          <b-input-group size="md" prepend="API Key">
            <b-form-input v-model="apiKey"></b-form-input>
          </b-input-group>
          <div class="input-group-container">
            <!-- <b-input-group class="atr-input-group" size="md" prepend="Previous Trade Date">
              <b-form-input v-model="previousTradingDay"></b-form-input>
            </b-input-group> -->
            <b-input-group class="atr-input-group" size="md" prepend="ATR multiple">
              <b-form-input v-model="atrMultiple"></b-form-input>
            </b-input-group>
            <b-input-group class="symbols-input-group" size="md" prepend="Symbol(s)">
              <b-form-input v-model="symbols" v-on:keyup.enter="onSearch" :disabled="scanAll"></b-form-input>
              <b-input-group-append is-text>
                Search All
              </b-input-group-append>
              <b-input-group-prepend is-text>
                <input type="checkbox" aria-label="Checkbox for Scaning all weekly options" v-model="scanAll">
              </b-input-group-prepend>
              <b-input-group-append>
                <b-button variant="info" @click="onSearch">
                  Search
                </b-button>
                <!-- <b-button variant="info" @click="onTest">
                  Test
                </b-button> -->
              </b-input-group-append>
            </b-input-group>
          </div>
          <b-overlay rounded="sm" spinner-variant="primary" spinner-type="grow" spinner>
            <b-progress v-if="isLoading" :value="numOfSearchDone" :max="numOfSearch" show-progress animated></b-progress>
            <b-table sticky-header striped hover :items="options" :fields="fields" :sort-by.sync="sortBy" :sort-desc.sync="sortDesc"></b-table>
          </b-overlay>
        </b-card>
      </b-col>
    </b-form-row>
  </b-container>
</template>

<script>
import {getOptionChain, getCurrentPrice, getRSI7, getATR7, getEODStockPrice, getEarnings} from "../services/IntrinioService";
import {BlackScholes} from "../services/BackSchols";
import {WeeklyOptions} from "../services/WeeklyOptions";
import EarningsData from '../services/earnings.json'; // earnings up to Feb 17 2021
// import VueTradingView from 'vue-trading-view';

export default {
  name: 'OptionScanner',
  props: {
    msg: String
  },
  components: {
    // VueTradingView,
  },
  data: function () {
    return {
      symbols: "",
      apiKey: "",
      stock_price: 75.68,
      targetStirke: 0,
      isLoading: false,
      options: [],
      numOfSearchDone: 0,
      scanAll: false,
      atrMultiple: 1.5,
      scanStartTime: null,
      scanEndTime: null,
      sortBy: "annualized_%",
      sortDesc: true,
      EarningsData: EarningsData,
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
          key: 'ask',
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
          key: 'premium/day',
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
    previousTradingDay() {
      const date = new Date();
      for (var i = 1; i < 6; i ++) {
        let dayOfWeek = new Date(date.setDate(date.getDate() - i)).getDay();
        if (dayOfWeek % 6 !== 0) {
          break;
        }
      }
      return this.formatDate(date);
    },
    today() {
      return new Date();
    },
    thisFriday() {
      return this.getNextDayOfWeek(new Date(), 5);
    },
    thisFridayStr() {
      return this.formatDate(this.thisFriday);
    },
    nextFriday() {
      const date = this.thisFriday;
      date.setDate(date.getDate() + 1);
      return this.getNextDayOfWeek(date , 5);
    },
    nextFridayStr() {
      return this.formatDate(this.nextFriday);
    },
    symbolsArray() {
      return this.symbols.split(',');
    },
    numOfSearch() {
      return this.scanAll ? this.weeklyOptionsArray.length : this.symbolsArray.length;
    },
    numOfResults() {
      return this.options.length;
    },
    uniqueSymbols() {
      return [...new Set(this.options.map(item => item.symbol))];
    },
    uniqueSymbolsStr() {
      return this.uniqueSymbols.join(",");
    },
    call() {
      return BlackScholes(36.07, 0.4825, 35, 26, 0.01, true);
    },
    weeklyOptionsArray() {
      return WeeklyOptions;
    },
    durationInMin() {
      if (this.scanEndTime === null || this.scanStartTime === null) {
        return "";
      }

      return Math.round((this.scanEndTime.getTime() - this.scanStartTime.getTime())/(1000 * 60));
    },
  },
  methods: {
    formatDate(date) {
      var d = new Date(date),
          month = '' + (d.getMonth() + 1),
          day = '' + d.getDate(),
          year = d.getFullYear();

      if (month.length < 2) 
          month = '0' + month;
      if (day.length < 2) 
          day = '0' + day;

      return [year, month, day].join('-');
    },
    /**
     * params
     * date [JS Date()]
     * dayOfWeek [int] 1 (Mon) - 7 (Sun)
    */
    getNextDayOfWeek(date, dayOfWeek) {
        // Code to check that date and dayOfWeek are valid left as an exercise ;)

        var ret = new Date(date||new Date());
        ret.setDate(ret.getDate() + (dayOfWeek - 1 - ret.getDay() + 7) % 7 + 1);
        return ret;
    },
    diffDates(startDate, endDate) {
      return Math.round((endDate - startDate)/(1000*60*60*24)) + 1;
    },
    dte(expiration) {
      return this.diffDates(new Date(), Date.parse(expiration));
    },
    annualized(item) {
      return Math.round(item.price.bid * 365 / ((this.dte(item.option.expiration) + 1) * item.option.strike) * 100);
    },
    premium_per_day(item) {
      return Math.round(item.price.bid * 100 / (this.dte(item.option.expiration) + 1));
    },
    filterOption(chain) {
      chain = chain.filter((item) => item.option.type === "put" &&
        // (this.stock_price - item.option.strike)/this.stock_price >= 0.035 &&
        item.option.strike < this.targetStirke &&
        this.annualized(item) >= 30 &&
        this.annualized(item) <= 100 &&
        item.price.bid > 0.25 &&
        item.price.bid < item.price.ask && //filter out bad data, as bid should always be lower than ask
        (this.today.getTime() - Date.parse(item.price.last_timestamp)) / (1000 * 3600 * 24) <= 1); //make sure option is traded in last 24 hr

      // console.log(data);
      chain.forEach((item) => {
        this.options.push({
          "symbol": item.option.ticker,
          "stock_price": this.stock_price,
          "strike": item.option.strike,
          "bid": item.price.bid,
          "ask": item.price.ask,
          "expiry": item.option.expiration,
          "drop_%": Math.round((this.stock_price - item.option.strike)/this.stock_price*100),
          "DTE": this.dte(item.option.expiration),
          "premium/day": this.premium_per_day(item),
          "annualized_%": this.annualized(item)
        })
      })
    },
    async onSearch() {
      this.scanStartTime = new Date();
      this.numOfSearchDone = 0;
      this.isLoading = true;
      this.options = [];
      let list = this.scanAll ? this.weeklyOptionsArray : this.symbolsArray;
      for(var i = 0; i < list.length; i++) {
        let symbol = list[i].toUpperCase();
        try {
          this.numOfSearchDone ++;

          let response = await getCurrentPrice(this.apiKey, symbol)
          this.stock_price = response.data.last_price;
          // console.log(`${symbol} - ${this.stock_price}`);

          response = await getEODStockPrice(this.apiKey, symbol, this.previousTradingDay)
          let dropPercent = (this.stock_price - response.data.historical_data[0].value) / response.data.historical_data[0].value;
          if (dropPercent > -0.01) {
            continue;
          }

          if (this.stock_price < 15 || this.stock_price > 400) {
            continue;
          }

          response = await getRSI7(this.apiKey, symbol, this.previousTradingDay)
          if (response.data.technicals[0].rsi > 60) {
            continue;
          }

          response = await getATR7(this.apiKey, symbol, this.previousTradingDay)
          this.targetStirke = this.stock_price - response.data.technicals[0].atr * this.atrMultiple;

          try {
            // check earnings
            let nextEarnings = this.EarningsData.earnings.find(item => item.code===`${symbol}.US`);
            let hasEarningThisWeek = false;
            let hasEarningNextWeek = false;
            if (nextEarnings) {
              let nextEarningReportDate = nextEarnings.report_date
              hasEarningThisWeek = this.diffDates(new Date(), Date.parse(nextEarningReportDate)) > 0 && this.diffDates(Date.parse(nextEarningReportDate), this.thisFriday) > 0;
              hasEarningNextWeek = this.diffDates(new Date(), Date.parse(nextEarningReportDate)) > 0 && this.diffDates(Date.parse(nextEarningReportDate), this.nextFriday) > 0;              
            }
            
            let chain;
            // Make sure no earning this week
            if (!hasEarningThisWeek) {
              response = await getOptionChain(this.apiKey, symbol, this.thisFridayStr);
              chain = response.data.chain;
              this.filterOption(chain);
            }

            // Make sure no earning next week
            if (!hasEarningNextWeek) {
              response = await getOptionChain(this.apiKey, symbol, this.nextFridayStr);
              chain = response.data.chain;
              this.filterOption(chain);
            }

          } catch (error) {
            console.error(`error processing ${symbol} - ${error}`);
          }
        } catch (error) {
            console.error(`error processing ${symbol} - ${error}`);
        }
      }
      this.isLoading = false;
      this.scanEndTime = new Date();
    },
    async onTest() {
      let res = await getEarnings();
      console.log(res.data);
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  #vue-trading-view {
    height: 100vh;
  }
  .scanner{
    margin-top: 0.5rem;
  }
  .b-table-sticky-header {
    max-height: 52rem;
  }
  .input-group-container {
    display: flex;
  }
  .atr-input-group {
    width: 20%;
  }
  .symbols-input-group {
    width: 80%;;
  }
  .col-md-6 {
    padding: unset;
  }
  @media (max-width: 765px) {
    #vue-trading-view {
    height: 50vh;
  }
  }
  @media (min-width: 1200px) {
    .container, .container-lg, .container-md, .container-sm, .container-xl {
      max-width: unset;
    }
  }
</style>
