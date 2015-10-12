// server.js
'use strict';
// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express'),        // call express
    server = exports.server = express(), // define our server using express
    bodyParser = require('body-parser'),
    esLoadHandler = require('./api/helpers/esloadhandler.js'),
    elasticSearch = require('elasticsearch'),
    targets = require('./api/constants/targets.json'),
    config = require('./api/constants/configuration.json'),
    exphbs = require('express-handlebars'),
    swagger = require('./api/swagger/schemas/spec-schema.json'),
    Firebase = require('firebase');

//Firebase Instance
var firebaseRef = new Firebase(config.firebaseIO);

//elastic search client minimum config , we use the docker ip in our host 'boot2docker ip for windows' or 'ifconfig for linux'
var esClient = new elasticSearch.Client({
    host: config.elasticsearchHost,
    log: 'error'
});
//elastic search client min config.
//elastic search client optional config
var rssOptions = {
    type: 'rss',
    orderBy: 'pubdate'
};

var esBulkAction = function (feed, rssOptions) {
    return {index: {_index: feed.index, _type: rssOptions.type, _id: feed.title}};
};
//with this function you can select the fields of the rss source feed you want to persist in EL,
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
//elastic search client optional config

// configure server to use bodyParser()
// this will let us get the data from a POST
server.use(bodyParser.urlencoded({extended: true}));
server.use(bodyParser.json());
server.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
server.set('views', __dirname + '/swagger/views');
server.engine('hbs', exphbs({extname: '.hbs'}));
server.set('view engine', 'hbs');
server.use(express.static('swagger/views'));
//server.use(require('connect-livereload')());

var port = process.env.PORT || 3002;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8081/api)
router.get('/spec', function (req, res) {
    res.json(swagger);
});
// test route to make sure everything is working (accessed at GET http://localhost:8081/api)
router.post('/createUser', function (req, res) {
    res.json(firebaseRef.createUser({
        email: req.body.email,
        password: req.body.password
    }, function (error, userData) {
        if (error) {
            console.log("Error creating user:", error);
            return error;
        } else {
            console.log("Successfully created user account with uid:", userData.uid);
            return userData.uid;
        }
    }));
});
// charge rss from targets.json in docker elastic search
router.get('/', function (req, res) {
    res.render('index');
});
// charge rss from targets.json in docker elastic search
router.get('/v1/rssload', function (req, res) {
    esLoadHandler(targets, esClient, rssOptions, esBulkAction, mapper, function (error, feeds) {
        res.json(error ? error.message : undefined || feeds);
    });
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
server.use('/', router);

// START THE SERVER
// =============================================================================
server.listen(port);
console.log('Server Node Api listening on port ' + port);