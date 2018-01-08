var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');


var port = process.env.PORT || 8000;
mongoose.connect(config.database);

app.set('superSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

var apiRouter = express.Router();

apiRouter.get('/', function (req, res) {
    res.json({ message: 'Welcome to coolest API' })
})

apiRouter.post('/authenticate', function (req, res) {
    User.findOne({
        name: req.body.name
    }, function (err, user) {
        if (err)
            throw err;
        if (!user) {
            res.json({ success: false, message: 'Authentication failed, User not found ' })
        } else if (user) {
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed, Wrong Password' });
            } else {
                const payload = {
                    admin: user.admin
                }
                var token = jwt.sign(payload, app.get('superSecret'), {
                    expiresIn: 60
                });

                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                })
            }
        }
    })
});

apiRouter.use(function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token' })
            } else {
                req.decoded = decoded;
                next();
            }
        })
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        })
    }
})

apiRouter.get('/users', function (req, res) {
    User.find({}, function (err, users) {
        res.json(users);
    })
})

app.use('/api', apiRouter);

app.get('/', function (req, res) {
    res.send('Hello ! The API is at http://localhost:' + port + '/api');
});

app.get('/setup', function (req, res) {
    // create a sample user
    var nick = new User({
        name: 'Nick Lodeon',
        password: 'password',
        admin: true
    });

    nick.save(function (err) {
        if (err)
            throw err;
        console.log('User Saved Successfully');
        res.json({ success: true })
    })
})

app.listen(port);
console.log('Server listening at http://localhost:' + port);