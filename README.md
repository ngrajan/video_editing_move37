# Video Processing API

A Node.js API to **upload**, **add subtitles**, **render** and **download**

## Features

**Upload Videos:** Store videos locally and metadata in postgreSQL
**Trim Videos:** Cut sections of a video by timestamp
**Add Subtitles:** Overlay text on the video with custom timing
**Render final video:** Process the final version via a background queue
**Download Video:** Retrieve the processed video file.

## Setup Instructions

### 1 Clone Repository:

- git clone https://github.com/ngrajan/video_editing_move37.git
- cd video-processing-api

### 2 Install Dependencies

npm install

### 3 Install FFmpeg(Windows)

https://ffmpeg.org/download.html#build-windows

### 4 Configure Environment Variables (use dotenv package)

### 5 Setup database (postgreSQL with Prisma ORM)

Once the database setup is done, migrate the db initialize the database schema

### 6 Start the server(along with debugger brake points)

i) Start the redis server
ii) npm run start:all - to run bull and redis server along with node appliction.
