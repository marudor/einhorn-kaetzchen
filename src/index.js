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
      new download().get(m.media_url_https).rename(moment(tweet.created_at).format('DD.MM.YYYY HHmm')).dest('episodes').run();
    });
  }
}

client.get('statuses/user_timeline', options, (error, params) => {
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
