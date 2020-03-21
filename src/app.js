require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const errorHandler = require('./errorHandler');
const HmdsRouter = require('./Hmds/hmds-router');
const bodyParser = require('body-parser');

const fs = require('fs');
const AWS = require('aws-sdk');

const app = express();

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', {
  skip: () => NODE_ENV === 'test'
}));

app.use(cors());
app.use(helmet());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/hmds', HmdsRouter);


app.get('/', (req, res) => {
  res.send('Hello, VR API!');
});
app.get('/api/upload', (req, res) => {
  res.send('Hello, Upload!');
});

var sign_s3 = require('./sign_s3');

app.use('/api/upload', sign_s3.sign_s3);

app.use(errorHandler);

module.exports = app;