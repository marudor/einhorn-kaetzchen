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
  trim_user: true,
  include_rts: false,
  exclude_replies: true
};

if (last) {
  options.since_id = last;
}


function processTweet(tweet) {
  if (tweet.entities.media.length > 0) {
    _.each(tweet.entities.media, m => {
      var created = moment(tweet.created_at);
      var fileName = created.format('DD.MM.YYYY HHmm')+'.png';
      new download().get(m.media_url_https+':large').rename(fileName).dest('episodes/pictures').run();
      var tw = {
        text: tweet.text,
        file: fileName,
        rawTweet: tweet
      };
      fs.writeFileSync('episodes/'+created.format('DD.MM.YYYY HHmm')+'.json', JSON.stringify(tw));
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
  fs.writeFileSync(__dirname+'/gotOld.json', max);
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
      if (tweet.text.indexOf('RT') === 0) {
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
