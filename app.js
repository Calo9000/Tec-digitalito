const port = 3000;
const path = require('path');
const logger = require('morgan');
const express = require('express');
const passport = require('passport')
const { title } = require('process');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { db } = require('./models/User');
const { Http2ServerRequest } = require('http2');

//App used-passport
const app = express();
app.set('port', process.env.PORT || 3000);
require('./config/passport')

//View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');  

//MiddleWare
app.use(logger('dev')); 
app.use(cookieParser('secret oh hi there'))
app.use(bodyParser.urlencoded({
    extended: true
 }));
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({    
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req,  res,  next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});


app.use(require('./routes/user.routes'));
app.use(require('./routes/index.routes'));
app.use(require('./routes/course.routes.js'));

module.exports = app;