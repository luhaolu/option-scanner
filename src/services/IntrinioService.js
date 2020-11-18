import axios from 'axios';

export function getOptionChain(api_key,symbol,exp) {
    return axios.get(`https://api-v2.intrinio.com/options/chain/${symbol}/${exp}/realtime?source=delayed&moneyness=out_of_the_money&type=put&api_key=${api_key}`);
}

export function getEODStockPrice(api_key,symbol, date) {
    return axios.get(`https://api-v2.intrinio.com/securities/${symbol}/historical_data/adj_close_price?frequency=daily&start_date=${date}&api_key=${api_key}`);
}

export function getCurrentPrice(api_key, symbol) {
  return axios.get(`https://api-v2.intrinio.com/securities/${symbol}/prices/realtime?source=bats_delayed&api_key=${api_key}`)
}

export function getRSI7(api_key, symbol, date) {
  return axios.get(`https://api-v2.intrinio.com/securities/${symbol}/prices/technicals/rsi?period=7&price_key=close&page_size=100&start_date=${date}&api_key=${api_key}`)
}

export function getATR7(api_key, symbol, date) {
  return axios.get(`https://api-v2.intrinio.com/securities/${symbol}/prices/technicals/atr?period=7&page_size=1&start_date=${date}&api_key=${api_key}`);
}

export function test() {
  return axios.get("https://localhost:44315/api/options");
}

export function getEarnings() {
  return axios.get("https://eodhistoricaldata.com/api/calendar/earnings?api_token=5a3bcc52df1e3&fmt=json&from=2020-11-17&to=2021-3-1&symbols=GSX.US,MSFT.US");
}

export function screenSecurities(api_key) {
    return axios.post(`https://api-v2.intrinio.com/securities/screen?api_key=${api_key}`, {
        "operator": "AND",
        "clauses": [
          {
            "field": "marketcap",
            "operator": "gt",
            "value": "1000000000"
          },
        //   {
        //     "field": "bid_price",
        //     "operator": "gt",
        //     "value": "20"
        //   }
        //   ,
        //   {
        //     "field": "bid_price",
        //     "operator": "lt",
        //     "value": "200"
        //   }
        ]
      });
}