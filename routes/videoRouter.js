const express = require('express');
const videoController = require('../controllers/videoController');

const router = express.Router();

router.route('/upload').post(videoController.uploadVideo);
router.route('/:id/trim').post(videoController.trimVideo);
router.route('/:id/subtitles').post(videoController.addSubtitle);
router.route('/:id/render').post(videoController.renderFinalVideo);
router.route('/:id/download').get(videoController.downloadVideo);

module.exports = router;
