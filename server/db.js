// db.js is a tiny persistence layer for myfavoritebooze that uses
// mongodb and the mongodb client library.
//
// This implementation is really not the point of the myfavoritebooze
// example code and is just provided for completeness (the point is
// how you can do authentication with browserid).  

const
url = require('url'),
mongodb = require('mongodb');

var collections = {
  dev:  undefined,
  beta: undefined,
  prod: undefined
};

exports.connect = function(cb) {
  if (!process.env.MONGOLAB_URI) {
    cb("no MONGOLAB_URI env var!");
    return;
  }

  var bits = url.parse(process.env.MONGOLAB_URI);
  var server = new mongodb.Server(bits.hostname, bits.port, {});
  new mongodb.Db(bits.pathname.substr(1), server, {}).open(function (err, cli) {
    if (err) return cb(err);
    collections.dev = new mongodb.Collection(cli, 'devboozes');
    collections.local = collections.dev;
    collections.beta = new mongodb.Collection(cli, 'betaboozes');
    collections.prod = new mongodb.Collection(cli, 'prodboozes');

    // now authenticate
    var auth = bits.auth.split(':');
    cli.authenticate(auth[0], auth[1], function(err) {
      cb(err);
    });
  });
}; 

exports.get = function(collection, email, cb) {
  var c = collections[collection].find({ email: email }, { booze: 1 });
  c.toArray(function(err, docs) {
    if (err) return cb(err);
    if (docs.length != 1) return cb("consistency error!  more than one doc returned!");
    cb(undefined, docs[0].booze);
  });
};

exports.set = function(collection, email, booze, cb) {
  collections[collection].update(
    { email: email },
    {
      email: email,
      booze: booze
    },
    {
      safe:true,
      upsert: true
    }, cb);
};
