require('dotenv').config()

const fetch = require('node-fetch');
var fs = require('fs');


let { lowPriceSinceSelling = 0, highPriceSinceSelling = 0, salePrice = 0 } = process.env.STARTING_DATA

console.log("lowPriceSinceSelling: ", lowPriceSinceSelling)
console.log("highPriceSinceSelling: ", highPriceSinceSelling)
console.log("salePrice: ", salePrice)



let liveMode = false
let oldAmount = 0

let lowPriceWhileHolding = 0
let highPriceWhileHolding = 0

// let lowPriceSinceSelling = 39317.57
// let highPriceSinceSelling = 39563.61

let purchasePrice = 0;
// let salePrice = 39540.15;

let currentlyHolding = false;
let profit = 0;
let totalProfit = 0
let transactionCount = 0

notHoldinghighLowDiff = () => {
  return parseFloat(highPriceSinceSelling) - parseFloat(lowPriceSinceSelling)
}

holdingHighLowDiff = () => {
  return parseFloat(highPriceWhileHolding) - parseFloat(lowPriceWhileHolding)
}


// For both of these, we're using a percent of the price range since we bought (holdingHighLowDiff) or sold (notHoldinghighLowDiff)

// if the current price falls 10% from the high since we bought
fallingPrice = (price) => {
  if (holdingHighLowDiff() < 1000) { return false }
  return parseFloat(price) < (parseFloat(highPriceWhileHolding) - (holdingHighLowDiff() * 0.10))
}

// if the current price rises 15% above the low since we sold
risingPrice = (price) => {
  if (notHoldinghighLowDiff() < 1000) { return false }
  return parseFloat(price) > (parseFloat(lowPriceSinceSelling) + (notHoldinghighLowDiff() * 0.15))
}


tradeBitcoin = async (price = null) => {

  let amount = null

  if (price) {
    amount = price
  } else {
    const response = await fetch('https://api.coinbase.com/v2/prices/spot?currency=USD');
    const json = await response.json();
    let { data } = json
    amount = data.amount

    // if (amount != oldAmount) {
    //   console.log(amount)
    //   oldAmount = amount
    //   fs.appendFile('array2.csv', amount.toString() + ',', (err) => {
    //     if (err) throw err;
    //   });
    // }
  }



  if (currentlyHolding && (parseFloat(amount) > parseFloat(highPriceWhileHolding))) {
    highPriceWhileHolding = amount
    console.log("NEW HIGH PRICE WHILE HOLDING: ", highPriceWhileHolding)
  }

  if (currentlyHolding && (parseFloat(amount) < parseFloat(lowPriceWhileHolding))) {
    lowPriceWhileHolding = amount
    console.log("NEW LOW PRICE WHILE HOLDING: ", lowPriceWhileHolding)

  }

  if (!currentlyHolding && (parseFloat(amount) > parseFloat(highPriceSinceSelling))) {
    highPriceSinceSelling = amount
    console.log("NEW HIGH PRICE SINCE SELLING: ", highPriceSinceSelling)
  }

  if (!currentlyHolding && (parseFloat(amount) < parseFloat(lowPriceSinceSelling))) {
    lowPriceSinceSelling = amount
    console.log("NEW LOW PRICE SINCE SELLING: ", lowPriceSinceSelling)
  }

  // Uncomment if you want to see when fallingPrice is true regardless of if we'd make a profit selling
  // if (currentlyHolding && fallingPrice(amount)) {
  //   if (!amount) { throw error }
  //   console.log(`${amount} IS 10% BELOW HIGH OF: ${highPriceWhileHolding}`)
  // }


  // Only sell if fallingPrice AND we won't lose money (so higher than purchase price PLUS 1% total coinbase commission)
  if (currentlyHolding && fallingPrice(amount) && (parseFloat(amount) > parseFloat(purchasePrice) * 1.03)) {
    console.log("--------- SELLING --------------")
    console.log("CURRENT PRICE: ", amount)
    console.log("holdingHighLowDiff: ", holdingHighLowDiff())
    console.log("highPriceWhileHolding: ", highPriceWhileHolding);
    console.log("lowPriceWhileHolding: ", lowPriceWhileHolding);

    if (liveMode) {
      sendText(`SELL SELL SELL! Bitcoin is at ${amount} and dropping fast! `)
    }

    transactionCount += 1
    currentlyHolding = false
    highPriceSinceSelling = amount
    lowPriceSinceSelling = amount
    lowPriceWhileHolding = amount
    highPriceWhileHolding = amount

    salePrice = amount
    profit = salePrice - purchasePrice;
    buyFee = parseFloat(purchasePrice) * .005
    sellFee = parseFloat(salePrice) * .005
    totalProfit = totalProfit + profit - buyFee - sellFee

    console.log("SOLD AT:", salePrice)
    console.log("COINBASE FEE: ", sellFee)
    console.log("PROFIT: ", profit)
    console.log("TOTAL PROFIT: ", totalProfit)
    console.log("-------------------------------")
  }



  if (!currentlyHolding && risingPrice(amount)) {
    console.log("--------- BUYING --------------")
    console.log("CURRENT PRICE: ", amount)
    console.log("risingPrice Amount: ", parseFloat(lowPriceSinceSelling) + (notHoldinghighLowDiff() * 0.15))

    console.log("notHoldinghighLowDiff: ", notHoldinghighLowDiff())
    console.log("highPriceSinceSelling: ", highPriceSinceSelling);
    console.log("lowPriceSinceSelling: ", lowPriceSinceSelling);

    if (liveMode) {
      sendText(`BUY BUY BUY! Bitcoin is at ${amount} and rising fast! `)
    }

    transactionCount += 1
    currentlyHolding = true
    lowPriceWhileHolding = amount
    highPriceWhileHolding = amount
    highPriceSinceSelling = amount
    lowPriceSinceSelling = amount
    purchasePrice = amount

    buyFee = parseFloat(purchasePrice) * .005

    console.log("PURCHASED AT: ", purchasePrice)
    console.log("COINBASE FEE: ", buyFee)

    console.log("-------------------------------")
  }

}

sendText = (message) => {
  console.log("Sending Text")
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);

  client.messages
    .create({
      body: message,
      from: process.env.TWILIO_FROM_NUMBER,
      to: process.env.TWILIO_TO_NUMBER
    })
    .then(message => console.log(message.sid));

  if (process.env.TWILIO_FROM_NUMBER_2) {
    client.messages
      .create({
        body: message,
        from: process.env.TWILIO_FROM_NUMBER,
        to: process.env.TWILIO_TO_NUMBER_2
      })
      .then(message => console.log(message.sid));
  }
}

start = async () => {
  console.log("STARTING")

  const args = process.argv.slice(2)
  if (args[0] == "live") {
    liveMode = true
    console.log("Using live bitcoin data...")
    var bitcoinTradingInterval = setInterval(() => { tradeBitcoin() }, 5000)


    if (process.env.TWILIO_FROM_NUMBER) {
      sendText("Text Alerts Online!")
    }


  } else {
    console.log("Using historical bitcoin data...")

    let data = null

    try {
      data = fs.readFileSync('array.csv', 'utf8')
    } catch (err) {
      console.error(err)
    }

    let prices = data.split(',')

    prices.forEach(price => {
      if (price) {
        tradeBitcoin(price)
      }
    });
  }


  console.log("TOTAL PROFIT: ", totalProfit)
  console.log("TOTAL TRANSACTIONS: ", transactionCount)


}

start()
