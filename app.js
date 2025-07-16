require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('./configs/passportConfig'); 

var connectDB = require('./db'); 
connectDB(); 

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const authRoutes = require('./routes/auth');

var app = express();
app.use(session({
  secret: 'dskfjl3498rfl23!@#DFGJKLfdg9834dsfg93',
  resave: false,
  saveUninitialized: false,
}));
app.use(cors({
  origin: 'https://saa-s-ui.vercel.app', 
  credentials: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRoutes);

module.exports = app;
