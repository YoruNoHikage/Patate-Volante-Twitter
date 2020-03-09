# [@VolantePatate](https://twitter.com/VolantePatate)

## What is it?
Just a Twitter bot that listens for what you're saying. It will retweet and answer every tweet mentionning some of the specified keywords with predefined sentences.

## Configure
Begin by opening a new account for the bot on Twitter. Then, create an application for this account on [developer.twitter.com](https://developer.twitter.com), and get the API keys.

Setup the following environment variables with your Twitter API keys:

```bash
export CONSUMER_TOKEN=<YOUR_CONSUMER_TOKEN>
export CONSUMER_SECRET=<YOUR_CONSUMER_SECRET>
export ACCESS_TOKEN_KEY=<YOUR_ACCESS_TOKEN_KEY>
export ACCESS_TOKEN_SECRET=<YOUR_ACCESS_TOKEN_SECRET>
```

And fill `config.json` file with the parameters you want.

``` json
{
	"keywords": ["punk rock", "pop rock", "pop punk"],
	"blacklist": ["HeureFrancaise"],
	"word_blacklist": ["Justin", "Bieber", "#Belieber"]
}
```

As you can see, you can also specify a blacklist which will prevent the bot from replying to certain users: this can be particularly useful if you don't want the bot to be stuck in a loop with another bot.
You can blacklist words too, it can be useful when some people might think this is funny to RT thousands of the same tweet, just to gain vote in some
ridiculous contest (I'm not saying #MTVHottest :-°)

## Usage
Install Node.js, and use it to run the bot. Like this:

```bash
node bot.js
```
