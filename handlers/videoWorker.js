const videoQueue = require('./videoQueue');
const videoRenderProcessor = require('./videoRenderProcessor');

videoQueue.process(videoRenderProcessor);

console.log('Video render worker is running and listening for jobs...');
