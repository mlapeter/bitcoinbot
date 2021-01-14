# bitcoinbot
Super basic bot for playing around with bitcoin trading strategies.

## Getting Started

Run `npm install`

To run the bot against live bitcoin prices run `npm start live`

While running, the bot will update bitcoin prices every 5 seconds and store them in array2.csv

To run the bot against historical prices (located in array.csv) run `npm start`

Note: this is a very small and old set of prices, I'd recommend running the bot live for a day or two to get your own historical bitcoin prices or finding a better source.


## Basic Strategy

Start by buying bitcoin at current price. 

If it's going up, hold it. If it starts dropping, sell it. Only ever sell if we'll make a profit (it's above what we paid plus trading commissions).  

If it starts going up again after we sold, buy it again. Repeat.


### Determining When Price Is Falling

We track the high/low range since we purchased. If it's fallen 10% of that amount from the high, it's falling. 

Example: Bought at 30,000, it went up to $32,000, then it dropped to $31,500. It's falling since it dropped more than 10% of that range ($200).

### Determining When Price Is Rising

We track the high/low range since we sold. If it's risen 10% of that amount from the low, it's rising.

Example: Sold at $30,000, it went down to $27,000, then it rose to $27,500. It's rising since it rose more than 10% of that range ($300).

### Optional Text Alerts Via Twilio

If you want to get text alerts, setup your own Twilio account, then add a file called `.env` to the root of the application and put your info in the quotes:

```
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_FROM_NUMBER=""
TWILIO_TO_NUMBER=""
TWILIO_TO_NUMBER_2=""
```

`TWILIO_TO_NUMBER_2` is optional if you want it to text a second number.

### Notes

10% is just a randomly chosen variable for the rising/ falling threshold. It may be different in the actual code as this strategy is being constantly adjusted.
