const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Routers
const addRouter = require('./routes/add');
const reportRouter = require('./routes/report');
const usersRouter = require('./routes/users');
const aboutRouter = require('./routes/about');
const logsRouter = require('./routes/logs');

// Models
const Log = require('./models/logs');

// Setup Pino logger
const pino = require('pino');
const pinoHttp = require('pino-http');
const loggerPino = pino({ transport: { target: 'pino-pretty' } });

const app = express();

// Initialize all configurations
setupViewEngine(app);
setupMiddleware(app);
setupRoutes(app);   // routes including health
connectToMongoDB();
setupNotFoundHandler(app);
setupGlobalErrorHandler(app);

module.exports = app;

/**
 * Configure the template engine (Pug)
 * Sets the view engine for rendering error pages if needed
 */
function setupViewEngine(app) {
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');
}

/**
 * Configure middleware for logging, parsing, static files, and logs
 * Includes Morgan + Pino + saving logs to MongoDB
 */
function setupMiddleware(app) {
    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    // Add Pino logger middleware
    app.use(pinoHttp({ logger: loggerPino }));

    // Save each request to MongoDB logs collection
    app.use(async (req, res, next) => {
        try {
            await Log.create({ method: req.method, url: req.originalUrl });
        } catch (err) {
            loggerPino.error('Log save error:', err);
        }
        next();
    });
}

/**
 * Setup API routes
 * Includes a new /api/health route for Render health checks
 */
function setupRoutes(app) {
    // Health check route
    app.get('/api/health', (req, res) => {
        res.status(200).send('Server is running');
    });

    // Register all other routers under /api
    app.use('/api', aboutRouter);
    app.use('/api', addRouter);
    app.use('/api', reportRouter);
    app.use('/api', usersRouter);
    app.use('/api/logs', logsRouter);
}

/**
 * Connect to MongoDB Atlas using Mongoose
 * Reads connection string from environment variables
 */
function connectToMongoDB() {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then(() => loggerPino.info('✅ MongoDB connected'))
        .catch(err => loggerPino.error('❌ MongoDB connection error:', err));
}

/**
 * Handle routes that are not found
 * Creates a 404 error for unknown endpoints
 */
function setupNotFoundHandler(app) {
    app.use((req, res, next) => {
        next(createError(404));
    });
}

/**
 * Handle global errors
 * Renders error page with details in development mode only
 */
function setupGlobalErrorHandler(app) {
    app.use((err, req, res, next) => {
        const isDev = req.app.get('env') === 'development';
        res.locals.message = err.message;
        res.locals.error = isDev ? err : {};
        res.status(err.status || 500);
        res.render('error');
    });
}
