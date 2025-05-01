const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(
  'C:/Users/gokul/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-7.1.1-full_build/bin/ffmpeg.exe',
);

ffmpeg.setFfprobePath(
  'C:/Users/gokul/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-7.1.1-full_build/bin/ffprobe.exe',
);

module.exports = ffmpeg;
