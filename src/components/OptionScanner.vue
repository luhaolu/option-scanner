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
          <div class="input-group-container">
            <b-input-group size="md" prepend="API Key" style="min-width:50%">
              <b-form-input v-model="apiKey"></b-form-input>
            </b-input-group>
            <b-input-group size="md" prepend="This Friday">
              <b-form-input v-model="thisFridayInput"></b-form-input>
              <b-input-group-append>
                <b-form-datepicker button-only right locale="en-US" id="example-datepicker" v-model="thisFridayInput"></b-form-datepicker>
              </b-input-group-append>
            </b-input-group>
            <b-input-group size="md" prepend="Next Friday">
              <b-form-input v-model="nextFridayInput"></b-form-input>
              <b-input-group-append>
                <b-form-datepicker button-only right locale="en-US" id="example-datepicker" v-model="nextFridayInput"></b-form-datepicker>
              </b-input-group-append>
            </b-input-group>
          </div>
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
import EarningsData from "../services/earnings.json"; // earnings up to Feb 17 2021
import moment from "moment";
// import VueTradingView from "vue-trading-view";

export default {
  name: "OptionScanner",
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
          key: "symbol",
          sortable: true
        },
        {
          key: "stock_price",
          sortable: true
        },
        {
          key: "strike",
          sortable: true
        },
        {
          key: "bid",
          sortable: true
        },
        {
          key: "ask",
          sortable: true
        },
        {
          key: "expiry",
          sortable: true
        },
        {
          key: "drop_%",
          sortable: true
        },
        {
          key: "DTE",
          sortable: true
        },
        {
          key: "premium/day",
          sortable: true
        },
        {
          key: "annualized_%",
          sortable: true,
          sortDirection: "desc"
        },
      ],
      thisFridayInput: null,
      nextFridayInput: null,
      holidays: ["2020-11-26", "2020-12-25", "2021-1-1"]
    }
  },
  created  () {
    this.thisFridayInput = this.thisFridayStr;
    this.nextFridayInput = this.nextFridayStr;
  },
  computed: {
    previousTradingDay() {
      const date = moment();
      for (var i = 1; i < 6; i ++) {
        let dayOfWeek = date.subtract(1, "days").day();
        if (dayOfWeek % 6 !== 0 && this.holidays.find(x => x === this.formatDate(date)) === undefined) {
          break;
        }
      }
      return this.formatDate(date);
    },
    today() {
      return moment();
    },
    thisFriday() {
      return moment().days(5);
    },
    thisFridayStr() {
      return this.formatDate(this.thisFriday);
    },
    nextFriday() {
      return moment().days(12);
    },
    nextFridayStr() {
      return this.formatDate(this.nextFriday);
    },
    symbolsArray() {
      return this.symbols.split(",");
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

      return this.scanEndTime.diff(this.scanStartTime, "minutes");
    },
  },
  methods: {
    formatDate(date) {
      return date.format("YYYY-MM-DD");
    },
    diffDates(startDate, endDate) {
      return endDate.diff(startDate, "days")
    },
    dte(expiration) {
      return moment(expiration).diff(moment(), "days") + 1;
      // return this.diffDates(moment(), moment(expiration));
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
        // this.annualized(item) <= 100 &&
        item.price.bid > 0.25 &&
        item.price.bid < item.price.ask && //filter out bad data, as bid should always be lower than ask
        moment(item.price.last_timestamp).diff(moment(), "days") < 1); //make sure option is traded in last 24 hr

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
      this.scanStartTime = moment();
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
              // hasEarningThisWeek = this.diffDates(moment(), moment(nextEarningReportDate)) > 0 && this.diffDates(moment(nextEarningReportDate), this.thisFriday) > 0;
              hasEarningThisWeek = moment(nextEarningReportDate).isBetween(moment(), this.thisFriday) || moment(nextEarningReportDate).isSame((this.formatDate(moment())));
              hasEarningNextWeek = moment(nextEarningReportDate).isBetween(moment(), this.nextFriday);              
            }
            
            let chain;
            // Make sure no earning this week
            if (!hasEarningThisWeek) {
              response = await getOptionChain(this.apiKey, symbol, this.thisFridayInput);
              chain = response.data.chain;
              this.filterOption(chain);

              // Make sure no earning next week
              if (!hasEarningNextWeek) {
                response = await getOptionChain(this.apiKey, symbol, this.nextFridayInput);
                chain = response.data.chain;
                this.filterOption(chain);
              }
            }

          } catch (error) {
            console.error(`error processing ${symbol} - ${error}`);
          }
        } catch (error) {
            console.error(`error processing ${symbol} - ${error}`);
        }
      }
      this.isLoading = false;
      this.scanEndTime = moment();
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
