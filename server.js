const express = require('express')
const morgan = require('morgan')
const path = require('path')
const formidableMiddleware = require('express-formidable')
const requestIp = require('request-ip')
const cors = require('cors');
const { apiError } = require("./src/services/Response");
var partials = require('express-partials');
var expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// import i18n
const i18n = require('./src/i18n/i18n')

global.__basedir = `${__dirname}/`

// set port
const port = process.env.PORT || 3002

// create express application
const app = express();
const http = require('http');
const server = http.createServer(app);
const socket = require('./socket')(server);
// const vyparsocket = require('./vypar_socket')(server);

// app configuration
app.use(cookieParser('secret'))
app.use(session({
    secret: 'flash',
    saveUninitialized: true,
    resave: true,
    cookie: {
        maxAge: 60000
    }
}));
// console.log('1');
// app.use(formidableMiddleware());
// console.log('2');
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
    // app.use(expressLayouts);
app.set("views", path.join(`${__dirname}/src`, "views/"));

// app.set('view engine', 'pug')
app.set('view engine', 'ejs')
    // app.use(partials());

// console.log('3');
app.use(express.static(path.join(`${__dirname}/src`, 'public/')));
// console.log('4');
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))
app.use(i18n)
app.use(flash());
app.use(requestIp.mw())
app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    next()
})

// console.log('5');

// console.log(":::");
console.log(path.join(`${__dirname}/src`, 'public/assets/' + 'OfferLetter/1645611102.jpeg'));

// import routes
const { adminRoutes, apiUserRoutes, apiCompanyRoutes, apiStaffRoutes, apiWalletRoutes, apiChatRoutes, apiResumeRoutes, apiLandingPageRoutes } = require('./src/routes/index');
app.use('/admin', adminRoutes);

app.use('/api/', (req, res, next) => {
    if (req.body.sortBy || req.query.sortBy) {
        req.body.sortBy = req.query.sortBy = ((req.query.sortBy ? req.query.sortBy : req.body.sortBy) === "Ascending") ? 'ASC' : 'DESC'
    }
    next()
})
app.use('/api', apiUserRoutes, apiStaffRoutes, apiChatRoutes, apiCompanyRoutes, apiWalletRoutes, apiResumeRoutes, apiLandingPageRoutes);
app.get('/', (req, res) => {
    res.render('home')
})


// error handling
app.use((err, req, res, next) => {
    let error = apiError(err);
    res.status(error.status || 500);
    res.send(error);
});


const db = require("./src/models");
// db.sequelize.sync();

const Helper = require("./src/services/Helper");
// calling cron
// Helper.cronMailer();


server.listen(port);