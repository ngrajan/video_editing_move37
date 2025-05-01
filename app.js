const express = require('express');
const morgan = require('morgan');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

const videoRouter = require('./routes/videoRouter');
// const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

app.use('/api/videos', videoRouter);
// app.all('*', (req, res, next) => {
//   next(new AppError(`Cant't find ${req.originalUrl} on this server`, 404));
// });

app.use(globalErrorHandler);
module.exports = app;
