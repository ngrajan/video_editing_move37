// videoQueue.js
const Bull = require('bull');

const videoQueue = new Bull('video-render', {
  redis: { host: 'localhost', port: 6379 },
});

module.exports = videoQueue;
