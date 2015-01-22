var fs = require('fs');
var _ = require('lodash');

_.each(fs.readdirSync('./gulpTasks/'), function(t) {
  require('./gulpTasks/'+t);
});