const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const prisma = require('../utils/prismaClient');

const videoRenderProcessor = async (job) => {
  const { videoId } = job.data;

  const video = await prisma.video.findUnique({
    where: { id: parseInt(videoId, 10) },
    include: { subtitles: true },
  });

  if (!video) {
    throw new Error('Video not found');
  }

  const uploadsDir = path.join(__dirname, '..', 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  let inputFilePath;

  if (video.trimmedFilePath) {
    if (path.isAbsolute(video.trimmedFilePath)) {
      inputFilePath = video.trimmedFilePath;
    } else {
      inputFilePath = path.join(__dirname, '..', video.trimmedFilePath);
    }
  } else {
    inputFilePath = path.join(__dirname, '..', video.filePath);
  }

  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`Input video not found at: ${inputFilePath}`);
  }

  const outputFilename = `final-rendered-${Date.now()}-${video.storedName}`;
  const outputPath = path.join(uploadsDir, outputFilename);

  console.log('Rendering from:', inputFilePath);
  console.log('Saving rendered video to:', outputPath);

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputFilePath);

    if (video.subtitles && video.subtitles.length > 0) {
      const firstSubtitle = video.subtitles[0];

      if (firstSubtitle && firstSubtitle.filePath) {
        const subtitlePath = path.isAbsolute(firstSubtitle.filePath)
          ? firstSubtitle.filePath
          : path.join(__dirname, '..', firstSubtitle.filePath);

        if (fs.existsSync(subtitlePath)) {
          console.log('Burning subtitles from:', subtitlePath);
          command = command.videoFilters(`subtitles=${subtitlePath}`);
        } else {
          console.warn('Subtitle file not found:', subtitlePath);
        }
      } else {
        console.warn('No valid subtitle file path found in firstSubtitle');
      }
    } else {
      console.log('No subtitles found for this video');
    }

    command
      .output(outputPath)
      .on('start', (cmdLine) => {
        console.log('FFmpeg command:', cmdLine);
      })
      .on('end', async () => {
        try {
          await prisma.video.update({
            where: { id: parseInt(videoId, 10) },
            data: {
              finalVideoPath: outputPath,
              status: 'rendered',
            },
          });
          console.log(`Rendering complete: ${outputFilename}`);
          resolve();
        } catch (dbErr) {
          reject(dbErr);
        }
      })
      .on('error', (err) => {
        console.error('Error during rendering:', err);
        reject(err);
      })
      .run();
  });
};

module.exports = videoRenderProcessor;
