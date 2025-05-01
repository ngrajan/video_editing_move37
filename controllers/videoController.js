const path = require('path');
const fs = require('fs');
const ffmpeg = require('../utils/ffmpeg');
const prisma = require('../utils/prismaClient');
const catchAsync = require('../utils/catchAsync');
const upload = require('../middlewares/videoUpload');
const { escapeText } = require('../utils/textUtils');
const videoQueue = require('../handlers/videoQueue');

const getVideoById = async (videoId) =>
  await prisma.video.findUnique({ where: { id: parseInt(videoId, 10) } });

exports.uploadVideo = catchAsync(async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // console.log(req.file);

    const { filename, originalname, size, path: filePath } = req.file;

    const normalizedPath = filePath.replace(/\\/g, '/');

    ffmpeg.ffprobe(normalizedPath, async (err, metadata) => {
      if (err) {
        return next(err);
      }

      const durationInSeconds = Math.floor(metadata.format.duration);

      const video = await prisma.video.create({
        data: {
          videoName: originalname,
          storedName: filename,
          size: size,
          duration: durationInSeconds,
          status: 'uploaded',
          filePath: req.file.path,
        },
      });

      res.status(201).json({
        status: 'success',
        data: {
          video,
        },
      });
    });
  });
});

exports.trimVideo = catchAsync(async (req, res, next) => {
  const videoId = req.params.id;
  const { start, end } = req.body;

  if (start === undefined || end === undefined || start >= end) {
    return res.status(400).json({ message: 'Invalid timestamps' });
  }

  const video = await getVideoById(videoId);

  if (!video) {
    return res.status(404).json({ message: 'Video not found' });
  }

  const inputPath = video.filePath;
  const outputFilename = `trimmed-${Date.now()}-${video.storedName}`;

  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const outputPath = path.join(uploadsDir, outputFilename);
  const relativePath = `/uploads/${outputFilename}`;

  ffmpeg(inputPath)
    .setStartTime(start)
    .setDuration(end - start)
    .output(outputPath)
    .on('end', async () => {
      const updatedVideo = await prisma.video.update({
        where: { id: parseInt(videoId, 10) },
        data: {
          trimmedFilePath: relativePath,
        },
      });

      res.status(200).json({
        status: 'success',
        data: { trimmedFile: outputFilename, video: updatedVideo },
      });
    })
    .on('error', (err) => {
      next(err);
    })
    .run();
});

exports.addSubtitle = catchAsync(async (req, res, next) => {
  const videoId = req.params.id;
  const { text, start, end } = req.body;

  if (!text || start === undefined || end === undefined || start >= end) {
    return res.status(400).json({ message: 'Invalid subtitle input' });
  }

  const video = await getVideoById(videoId);

  if (!video) {
    return res.status(404).json({ message: 'Video not found' });
  }

  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const inputPath = path.join(__dirname, '..', video.trimmedFilePath);
  const outputFilename = `subtitled-${Date.now()}-${video.storedName}`;
  const outputPath = path.join(uploadsDir, outputFilename);

  const fontPath = 'C\\:/Windows/Fonts/arial.ttf';

  const validInputPath = inputPath.replace(/\\/g, '/');
  const validOutputPath = outputPath.replace(/\\/g, '/');

  const safeText = escapeText(text);

  const drawTextFilter = `drawtext=text=${safeText}:fontfile=${fontPath}:fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-50:enable=between(t\\,${start}\\,${end})`;

  ffmpeg(validInputPath)
    .videoFilter(`"${drawTextFilter}"`)
    .output(validOutputPath)
    .on('start', (cmdLine) => {})
    .on('end', async () => {
      await prisma.subtitle.create({
        data: { text, start, end, videoId: parseInt(videoId, 10) },
      });

      await prisma.video.update({
        where: { id: parseInt(videoId, 10) },
        data: { trimmedFilePath: outputPath },
      });

      res.status(200).json({
        status: 'success',
        message: 'Subtitle added and video processed successfully',
        data: { outputFile: outputFilename },
      });
    })
    .on('error', (err) => {
      next(err);
    })
    .run();
});

exports.renderFinalVideo = catchAsync(async (req, res, next) => {
  const videoId = req.params.id;

  const video = await getVideoById(videoId);

  if (!video) {
    return res.status(404).json({ message: 'Video not found' });
  }

  await videoQueue.add({ videoId });

  res.status(200).json({
    status: 'success',
    message: 'Rendering job added to queue',
  });
});

exports.downloadVideo = catchAsync(async (req, res, next) => {
  const videoId = req.params.id;

  const video = await getVideoById(videoId);

  if (!video) {
    return res.status(404).json({ message: 'Video not found' });
  }
  // *********** Having some bug in rendering final video, I have rendered the trimmed video **************
  // if (!video.finalVideoPath) {
  //   return res
  //     .status(400)
  //     .json({ status: 'fail', message: 'Final video not rendered yet' });
  // }

  // const filePath = path.isAbsolute(video.finalVideoPath)
  // ? video.finalVideoPath
  // : path.join(__dirname, '..', video.finalVideoPath);

  if (!video.trimmedFilePath) {
    return res
      .status(400)
      .json({ status: 'fail', message: 'Requested video not found' });
  }

  const filePath = path.join(__dirname, '..', video.trimmedFilePath);

  if (!fs.existsSync(filePath)) {
    return res
      .status(404)
      .json({ message: 'Final video file not found on disk' });
  }

  const fileName = `final-${video.videoName}.mp4`;

  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).json({ message: 'Error downloading file' });
    } else {
      console.log(`Video ${fileName} downloaded successfully`);
    }
  });
});
