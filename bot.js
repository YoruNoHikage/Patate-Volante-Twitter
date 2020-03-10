/* outa[bot] // app.js
	Copyright (c) 2012-2013 outa[dev].

   Modified by YoruNoHikage (with outadoc's agreement)
*/

(function() {
    //the twitter api module
    var Twitter = require('twitter'),
        LogUtils = require('./lib/LogUtils.js'),

        //the username of the bot. not set to begin with, we'll get it when authenticating
        botUsername = null,
        hasNotifiedTL = false,

        //get the config (API keys, etc.)
        config = require('./config.json'),

        //create an object using the keys we just determined
        twitterAPI = new Twitter({
            consumer_key: process.env.CONSUMER_KEY,
            consumer_secret: process.env.CONSUMER_SECRET,
            access_token_key: process.env.ACCESS_TOKEN_KEY,
            access_token_secret: process.env.ACCESS_TOKEN_SECRET,
        });

    //check if we have the rights to do anything
    twitterAPI.get('account/verify_credentials', (error, userdata) => {
        if (error) {
            //if we don't, we'd better stop here anyway
            LogUtils.logtrace(error, LogUtils.Colors.RED);
            process.exit(1);
        } else {
            //the credentials check returns the username, so we can store it here
            botUsername = userdata.screen_name;
            LogUtils.logtrace("logged in as [" + userdata.screen_name + "]", LogUtils.Colors.CYAN);

            //start listening to tweets that contain the bot's username using the streaming api
            initStreaming();
        }
    });

    function errorTwitter(error, statusData) {
        LogUtils.logtrace(error, LogUtils.Colors.RED);

        if(error.statusCode == 403 && !hasNotifiedTL) {
            //if we're in tweet limit, we will want to indicate that in the name of the bot
            //so, if we aren't sure we notified the users yet, get the current twitter profile of the bot
            twitterAPI.get('users/lookup', {screen_name: botUsername}, (error, data) => {
                if(!error) {
                    if(data[0].name.match(/(\[TL\]) (.*)/)) {
                        //if we already changed the name but couldn't remember it (maybe it was during the previous session)
                        hasNotifiedTL = true;
                    } else {
                        //if the name of the bot hasn't already been changed, do it: we add "[TL]" just before its normal name
                        twitterAPI.post('account/update_profile', {name: '[TL] ' + data[0].name}, (error, data) => {
                            if(error) {
                                LogUtils.logtrace("error while trying to change username (going IN TL)", LogUtils.Colors.RED);
                            } else {
                                LogUtils.logtrace("gone IN tweet limit", LogUtils.Colors.RED);
                            }
                        });
                    }
                }
            });
        }
    }

    function streamCallback(stream) {
        LogUtils.logtrace("streaming", LogUtils.Colors.CYAN);

        String.prototype.contains = String.prototype.includes;

        stream.on('data', function(data) {
            //if it's actually there
            if(!data.text) {
                LogUtils.logtrace("data.text is not defined", LogUtils.Colors.RED);
                console.log("Data: %j", data);
                return;
            }

            //a few checks to see if we should reply
            if(
                // if it was sent by the bot itself
                data.user.screen_name.toLowerCase() === botUsername.toLowerCase() ||
                // if the sender is in the blacklist
                config.blacklist.indexOf(data.user.screen_name) >= 0 ||
                // or if it is a retweet
                data.retweeted_status !== undefined
            ) {
                LogUtils.logtrace(`No need to reply to ${data.user.screen_name}.`, LogUtils.Colors.CYAN);
                return;
            }

            const tweet = data.truncated ? data.extended_tweet.full_text : data.text;
            const text = tweet.toLowerCase();

            if(config.word_blacklist.some(word => text.contains(word.toLowerCase()))) {
                LogUtils.logtrace("A blacklist word avoided", LogUtils.Colors.CYAN);
                return;
            }

            if (config.keywords.every(word => !text.contains(word))) {
                LogUtils.logtrace("Keywords not contained in the tweet", LogUtils.Colors.CYAN);
                return;
            }

            LogUtils.logtrace("[" + data.id_str + "] tweet from [" + data.user.screen_name + "]", LogUtils.Colors.GREEN);

            // retweet
            LogUtils.logtrace("Trying to retweet [" + data.id + "]", LogUtils.Colors.CYAN);
            twitterAPI.post('/statuses/retweet/' + data.id_str, {}, (error, statusData) => {
                    //when we got a response from twitter, check for an error (which can occur pretty frequently)
                    if(error) {
                        errorTwitter(error, statusData);
                    } else {
                        //if we could send the tweet just fine
                        LogUtils.logtrace("[" + statusData.retweeted_status.id_str + "] ->retweeted from [" + statusData.retweeted_status.user.screen_name + "]", LogUtils.Colors.GREEN);

                        //check if there's "[TL]" in the name of the but
                        var tweetLimitCheck = statusData.user.name.match(/(\[TL\]) (.*)/);	

                        //if we just got out of tweet limit, we need to update the bot's name
                        if(tweetLimitCheck != null) {
                            //DO EET
                            twitterAPI.post('account/update_profile', {name: tweetLimitCheck[2]}, (error, data) => {
                                if(error) {
                                    LogUtils.logtrace("error while trying to change username (going OUT of TL)", LogUtils.Colors.RED);
                                } else {
                                    hasNotifiedTL = true;
                                    LogUtils.logtrace("gone OUT of tweet limit", LogUtils.Colors.RED);
                                }
                            });
                        }
                    }
                }
            );

            var result = '';

            LogUtils.logtrace(tweet, LogUtils.Colors.CYAN);

            if(text.contains('patate volante') || text.contains('patates volantes') || 
                text.contains('patate ailée') || 
                text.contains('patate avion') ||
                text.contains('patate fusée') || 
                text.contains('tubercule volant') || 
                text.contains('tubercule volant') ||
                text.contains('pomme de terre volante'))
            {
                var rand = parseInt(Math.random() * (4 - 0) + 0);
                switch(rand) {
                    case 3 :
                        result = 'Patate volante ? Oui c\'est moi ! La seule, l\'unique !';
                        break;
                    case 2:
                        result = "Patate volante un jour, patate volante toujours !";
                        break;
                    case 1:
                        result = "Les patates volantes sont nos amies.";
                        break;
                    case 0:
                        result = "Vive les patates volantes.";
                        break;
                    default:
                        result = 'Carotte Volante ! Qu\'est-ce que je raconte moi ?';
                        break;
                }
            } 
            else if(text.contains('frite volante') || text.contains('chips volante')) {
                result = 'Le tout à base de patate volante, bien sûr !!!';
            }
            else if(text.contains('patate sautée') || text.contains('patates sautées')) {
                result = 'Les patates volantes sautées ne retombent pas dans la poêle !';
            } 
            else if(text.contains('pomme de terre rôtie')) {
                result = 'N\'essayez pas de nous rôtir, les patates volantes sont des dures à cuire.';
            } 
            else if(text.contains('patate farcie') || text.contains('patates farcies')) {
                result = 'Éventrer des patates est interdit pas la convention de Genève.';
            }
            /*else if(text.contains('cipt')) { // maybe we can find a solution
                result = 'Ici, c\'est hachis ! http://tinyurl.com/o9a2ly7 #CIPT';
            }*/ 
            else if(text.contains('axomama')) {
                result = 'Que la force de la toute puissante patate soit avec toi ! http://tinyurl.com/oa5jktv';
            } 
            else if(text.contains('pomme de terre en fête')) {
                result = 'La vie, c\'est la fête ! http://www.belledulie.fr/';
            }
            else {
                result = 'Les patates volantes sont nos amies !';
            }
            
            var today = new Date();
            var tweetDone = '@' + data.user.screen_name + " " + result + " " + (today.getHours()) % 24 + "h" + ('0' + today.getMinutes()).slice(-2);
            LogUtils.logtrace(tweetDone, LogUtils.Colors.YELLOW);

            //reply to the tweet that mentionned us
            twitterAPI.post('statuses/update', {
                status: tweetDone.substring(0, 279),
                in_reply_to_status_id: data.id_str,
                include_entities: 1,
              }, (error, statusData) => {
                    //when we got a response from twitter, check for an error (which can occur pretty frequently)
                    if(error) {
                        errorTwitter(error, statusData);
                    } else {
                        //if we could send the tweet just fine
                        LogUtils.logtrace("[" + statusData.in_reply_to_status_id_str + "] ->replied to [" + statusData.in_reply_to_screen_name + "]", LogUtils.Colors.GREEN);

                        //check if there's "[TL]" in the name of the but
                        var tweetLimitCheck = statusData.user.name.match(/(\[TL\]) (.*)/);	

                        //if we just got out of tweet limit, we need to update the bot's name
                        if(tweetLimitCheck != null) {
                            //DO EET
                            twitterAPI.post('account/update_profile', {name: tweetLimitCheck[2]}, (error, data) => {
                                if(error) {
                                    LogUtils.logtrace("error while trying to change username (going OUT of TL)", LogUtils.Colors.RED);
                                } else {
                                    hasNotifiedTL = true;
                                    LogUtils.logtrace("gone OUT of tweet limit", LogUtils.Colors.RED);
                                }
                            });
                        }
                    }
                }
            );
        
        });

        stream.on('error', onStreamError);
        stream.on('end', onStreamEnded);

        //automatically disconnect every 30 minutes (more or less) to reset the stream
        setTimeout(stream.destroy, 1000 * 60 * 30);
    }

    function onStreamError(e) {
        //when the stream is disconnected, connect again
        if(!e.statusCode) e.statusCode = "unknown";
        LogUtils.logtrace("streaming errored (" + e.statusCode + ")", LogUtils.Colors.RED);
    }

    function onStreamEnded(e) {
        //when the stream is disconnected, connect again
        if(!e.statusCode) e.statusCode = "unknown";
        LogUtils.logtrace("streaming ended (" + e.statusCode + ")", LogUtils.Colors.RED);
        setTimeout(initStreaming, 5000);
    }

    function initStreaming() {
        //initialize the stream and everything else

        twitterAPI.stream('statuses/filter', {track: config.keywords.join(', ')}, streamCallback);
    }

})();
