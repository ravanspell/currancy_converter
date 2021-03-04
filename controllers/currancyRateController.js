
/**
 * currancy converter
 * Author: ireshan M Pathirana
 */

const { successData,fail } = require('../helpers/response');
// verifi js the node js data validation 
// library written by me
const Validation = require("verifijs");
// memory-cache enable to handdle in memory 
// cash very easyly
const cache = require('memory-cache');
// axios sends http requests
const axios = require('axios');
// moment manage time
const moment = require('moment');
const validation = new Validation();

const convert = async (request, response) => {
    try {
        const data = request.body;
        // data validation
        const valid = await validation.check(data,
            {
                fromCurrency: "required|string",
                amount: "required",
                toCurrency: "required|string"
            }
        )
        if(!valid.validation){
            fail(valid.error, 422, response);
        }
        const {fromCurrency,amount,toCurrency} = data;
        
        // Sample cash structure
        // USD: [{"cur": "LKR", "amount": 195.51, "createdAt": "2021-03-03 23:19"},
        // {"cur": "INR", "amount": 222, "createdAt": "2021-02-18 23:19"},
        // {"cur": "PKR", "amount": 22, "createdAt": "2021-02-18 23:19"}]
       
        // check cash exist 
        // if yes retrun rate
        const cashedRate = _checkCash(toCurrency, fromCurrency)
        if(cashedRate){
            let responseData = {
                amount: _calculateRate(amount,cashedRate), 
                currency: toCurrency
                }
            return successData(responseData,response);
        }
        // get API base url
        const url = process.env.FIXER_BASE_URL;
        // get API access key
        const access_key = process.env.ACCESS_KEY
        // get currancy rate if not cached
        const curracyRate = await axios.get(`${url}/latest`,{
        params: {
            access_key,
            base: toCurrency,
            symbols: fromCurrency
        }});
        if(curracyRate.status === 200){
            const {data: fixerRes} = curracyRate
            console.log(fixerRes);
            // retrun if rate not available
            if(!fixerRes.success){
                return fail(fixerRes.error.type,403,response);
            }
            // cash currancy rate
            _createCash(toCurrency, fromCurrency, curracyRate)
            let currancyRate = fixerRes.rates[fromCurrency]
            let cashedResponseData = {
                amount: _calculateRate(amount,currancyRate), 
                currency: toCurrency
            }
            return successData(cashedResponseData, response);
        }
        return fail('connection failed: cannot get api data',403,response);
       
    } catch (error) {
        console.log(error.message);
        return fail('Internal Server Error',500,response);
    }
}
/**
 * 
 * @param {float} amount 
 * @param {float} rate 
 */
const _calculateRate = (amount, rate) =>{
    return amount / rate
}
/**
 * 
 * @param {string} key 
 * @param {string} value 
 */
const _checkCash = (key,value) => {

    let getCash = cache.get(key);
    if(getCash !== null){

        const cashData = JSON.parse(getCash)
        // find the required currancy rate
        const cashedRate = cashData.find(rate => rate.cur == value)

        if(cashedRate == undefined){
            return null
        }
        const before = moment(cashedRate.createdAt);
        const now = moment();
        // get cashed values hours difference
        const timeDiff = now.diff(before, 'hours', true)
        console.log('Hours', timeDiff)
        // check cashed data cashed within 24 hours
        if(timeDiff > 24){
            return null
        }
        return cashedRate.amount
    }
}

/**
 * 
 * @param {string} key 
 * @param {string} value 
 * @param {object} newRate 
 */
const _createCash =  (key,value,newRate) =>{
    console.log('create cash');
    const getCash = cache.get(key);
    const now = moment().format('YYYY-MM-DD HH:mm');
    const rateData = {
        cur: value, 
        amount: newRate.data.rates[value], 
        createdAt: now
    }
    if(getCash){
        const cashData = JSON.parse(getCash)
        const d = cashData.filter(f => f.cur != value)
        d.push(rateData)
        cache.put(key, JSON.stringify(d));
    }else{
        cache.put(key, JSON.stringify([rateData]));
    }
}

module.exports = {
    convert
};