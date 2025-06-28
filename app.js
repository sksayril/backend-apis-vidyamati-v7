require("dotenv").config()
require("./utilities/database")
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var userRouter = require('./routes/user.routes');
var chatRouter = require('./routes/chat.routes');

var app = express();
app.use(cors({
    origin: '*', // This allows all origins
  }));

app.use(logger('dev'));
app.use(express.json({limit: '500mb'}));
app.use(express.urlencoded({ limit: '500mb', extended: true }));


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/users', userRouter);
app.use('/api/chat', chatRouter);
module.exports = app;
