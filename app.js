'use strict';

var express = require('express');
var app = express();

// call the packages we need
//var express = require('express'),        // call express
//server = exports.server = express(), // define our server using express
var bodyParser = require('body-parser'),
    esLoadHandler = require('./api/helpers/esloadhandler'),
    elasticSearch = require('elasticsearch'),
    targets = require('./api/constants/targets.json'),
    exphbs = require('express-handlebars'),
    schema = require('./api/swagger/schemas/spec-schema.json'),
    configuration = require('./api/constants/configuration.json'),
    a127 = require('a127-magic'),
    Firebase = require('firebase');
//var firebaseRef

module.exports = app; // for testing

// initialize a127 framework
a127.init(function (config) {

    // include a127 middleware
    app.use(a127.middleware(config));


    //Firebase Instance
    var firebaseRef = new Firebase(configuration.firebaseIO);

    //elastic search client minimum config , we use the docker ip in our host 'boot2docker ip for windows' or 'ifconfig for linux'
    var esClient = new elasticSearch.Client({host: configuration.elasticsearchHost, log: 'error'});
    //elastic search client optional config
    var rssOptions = {type: 'rss', orderBy: 'pubdate'};

    var esBulkAction = function (feed, rssOptions) {
        return {index: {_index: feed.index, _type: rssOptions.type, _id: feed.title}};
    };
    //with this function you can select the fields of the rss source feed you want to persist in Elastic Search,
    // if you pass null it will get all the fields of the rss source by default
    var mapper = function (rss) {
        return {
            index: rss.index,
            title: rss.title,
            description: rss.description,
            pubdate: rss.pubdate,
            author: rss.author,
            link: rss.link,
            image: rss.image,
            meta: {
                title: rss.meta.title,
                image: rss.meta.image ? rss.meta.image.url : ''
            }
        };
    };

    // configure app to use bodyParser()
    // this will let us get the data from a POST
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
    console.log(__dirname);
    app.set('views', __dirname + '/swagger/views');
    app.engine('hbs', exphbs({extname: '.hbs'}));
    app.set('view engine', 'hbs');
    app.use(express.static('swagger/views'));

    // error handler to emit errors as a json string
    app.use(function (err, req, res, next) {
        if (typeof err !== 'object') {
            // If the object is not an Error, create a representation that appears to be
            err = {
                message: String(err) // Coerce to string
            };
        } else {
            // Ensure that err.message is enumerable (It is not by default)
            Object.defineProperty(err, 'message', {enumerable: true});
        }

        // Return a JSON representation of #/definitions/ErrorResponse
        res.set('Content-Type', 'application/json');
        res.end(JSON.stringify(err));
        next();
    });


    var port = process.env.PORT || 10010;
    // begin listening for client requests
    app.listen(port);

    console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
});
