/* Setting things up. */
var path = require('path'),
    request = require('request'),
    Twit = require('twit'),
    config = {
    /* Be sure to update the .env file with your API keys. See how to get them: https://botwiki.org/tutorials/make-an-image-posting-twitter-bot/#creating-a-twitter-app*/
      twitter: {
        consumer_key: process.env.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET,
        access_token: process.env.ACCESS_TOKEN,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET
      }
    },
    T = new Twit(config.twitter),
    user_stream = T.stream('user');

function get_tweet_id(url){
  if (url.indexOf('https://twitter.com/') > -1){
    return url.split('/')[5];  
  }
  else{
    return false;
  }
}

function send_twitter_dm(username, message){
  T.post('direct_messages/new', {
    screen_name: username,
    text: message
  }, 
  function(err, data, response){
    if (err){
      console.log('Error:', err);
    }
  });  
}

function retweet_tweet(tweet_id, user_name){
  T.post('statuses/retweet/:id',
    {
      id: tweet_id
    }, function(err, data, response) {
      if (err){
        send_twitter_dm(user_name, 'There was an error!\n\n' + err.message);
      }
      else{
        send_twitter_dm(user_name, 'Retweeted!');          
      }
    }
  );
}

user_stream.on('direct_message', function (dm) {
  T.get('friends/ids', { screen_name: process.env.BOT_USERNAME, stringify_ids: true },  function (err, data, response) {    
    (function(dm){
      if (data.ids && data.ids.indexOf(dm.direct_message.sender.id_str) > -1){
        var dm_text = dm.direct_message.text;
        if (dm_text.indexOf('https://t.co/') > -1){
          /* Checking if the message is a shortened URL. */
          var r = request.get(dm.direct_message.text, function (err, res, body) {
            /* If yes, we will use the request module to get the original URL. */
            if (r !== undefined){
              var original_url = r.uri.href;
              var tweet_id = get_tweet_id(original_url);
              if (tweet_id){
                var dm_sender = dm.direct_message.sender.screen_name;
                retweet_tweet(tweet_id, dm_sender);
              }
              else{
                var dm_sender = dm.direct_message.sender.screen_name;
                send_twitter_dm(dm_sender, "This doesn't look like a tweet to me.");
              }
            }
            else{
              var dm_sender = dm.direct_message.sender.screen_name;
              send_twitter_dm(dm_sender, "Couldn't get the original URL.");
            }
          });
        }
      }
    })(dm);
  });
});

/**********************************************************************************************/
/* The code below takes care of serving the index.html file, no need to change anything here. */

var express = require('express');
var app = express();
app.use(express.static('public'));
var listener = app.listen(process.env.PORT, function () {
  console.log('Your bot is running on port ' + listener.address().port);
});
