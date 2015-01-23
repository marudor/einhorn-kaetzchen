/* jshint camelcase: false */

const config = require('./config.json');
const Twitter = require('twitter');
const _ = require('lodash');
const fs = require('fs');
const download = require('download');
const moment = require('moment');


var client = new Twitter(config);

var last;
try {
  last = require('./last.json');
} catch (e) {}

var gotOld;
try {
  gotOld = require('./gotOld.json');
} catch (e) {}


var options = {
  user_id: 2978671564,
  include_rts: false,
  exclude_replies: true
};

if (last) {
  options.since_id = last;
}


function processTweet(tweet) {
  if (tweet.entities.media.length > 0) {
    _.each(tweet.entities.media, m => {
      new download().get(m.media_url_https+':large').rename(moment(tweet.created_at).format('DD.MM.YYYY HHmm')+'.png').dest('episodes').run();
    });
  }
}

var max;
var findOld = function(max_id = 556942909426389000) {
  client.get('statuses/user_timeline', {
    screen_name: 'sweet_sacura',
    count: 200,
    max_id: max_id,
    exclude_replies: true,
    include_rts: false
  }, (error, params) => {
    _.each(params, tweet => {
      max = tweet.id;
      if ((tweet.text.indexOf('Einhornkätzchen') !== -1 || tweet.text.indexOf('einhornkätzchen') !== -1) && tweet.entities.media && tweet.entities.media.length > 0) {
        processTweet(tweet);
      }
    });
    if (params && params.length > 0) {
      findOld(max);
    }
  });
};

if (!gotOld) {
  findOld();
  fs.writeFileSync(__dirname+'/max.json', max);
}

client.get('statuses/user_timeline', options, (error, params) => {
  if (error) {
    console.log(error);
    return;
  }
  _.each(params.reverse(), tweet => {
    last = tweet.id;
    processTweet(tweet);
  });
  last+=100;
  fs.writeFileSync(__dirname+'/last.json', last);
});

var startStream = () => {
  client.stream('statuses/filter', {follow: 2978671564}, stream => {

    stream.on('data', tweet => {
      if (tweet.retweeted) {
        return;
      }
      processTweet(tweet);
      if (last < tweet.id) {
        last = tweet.id + 100;
        fs.writeFileSync(__dirname+'/last.json', last);
      }
    });

    stream.on('error', () => {
      setTimeout(() => {
        startStream();
      });
    });
  });
};

startStream();
