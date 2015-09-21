(function () {
    'use strict';


    var FeedParser = require('feedparser'),
        rq = require('request'),
        async = require('async'),
        lodash = require('lodash');

    function getRss(targets, esClient, rssOpts, esBulkAction, mapper, next) {
        try {
            var asyncTasks = [], esCommands = [], req, action,
                defaultMapper = function (rss) {
                    return rss;
                };
            lodash.filter(targets, function (n) {
                return (n !== null && n !== '');
            });
            targets.forEach(function (target) {
                var feeds = [], feedParser = new FeedParser(), targetId = Object.keys(target)[0];

                asyncTasks.push(function (callback) {
                    var defaultErrorHandler = function (error) {
                        callback(error, null);
                    };
                    req = rq(target[targetId]);
                    req.on('error', defaultErrorHandler);
                    feedParser.on('error', defaultErrorHandler);

                    req.on('response', function (res) {
                        if (res.statusCode !== 200) {
                            return this.emit('error', new Error('Bad status code'));
                        }
                        this.pipe(feedParser);
                    });
                    feedParser.on('readable', function () {
                        var feed;
                        while ((feed = this.read())) {
                            feed.index = targetId;
                            feeds.push(lodash.map([feed], lodash.isFunction(mapper) ? mapper : defaultMapper)[0]);
                        }
                    });
                    feedParser.on('end', function () {
                        console.log('finished stream on index ' + targetId + ' length ' + feeds.length);
                        callback(null, rssOpts.orderBy ? lodash.sortByAll(feeds, rssOpts.orderBy) : feeds);
                    });
                });
            });

            async.parallel(asyncTasks, function (err, feeds) {
                try {
                    if (err) {
                        throw err;
                    }
                    lodash.flatten(feeds).forEach(function (feed) {
                        action = esBulkAction(feed, rssOpts);
                        esCommands.push(action);
                        esCommands.push(Object.keys(action)[0] === 'update' ? {doc: feed} : feed);
                    });
                    esClient.bulk({body: esCommands}, function (err, resp) {
                        next(err, resp);
                    });
                } catch (e) {
                    console.log(e);
                    next(e, feeds);
                }
            });
        } catch (e) {
            throw e;
        }
    }

    module.exports = {
        getRss: getRss
    };
})();