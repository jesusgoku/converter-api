import stream from 'node:stream';
import streamPromises from 'node:stream/promises';
import path from 'node:path';
import { fetchFile } from '@ffmpeg/ffmpeg';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidV4 } from 'uuid';
import workerpool from 'workerpool';
import { ffmpeg } from './ffmpeg';

const pool = workerpool.pool(path.join(__dirname, 'worker.js'));
const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(cors());

app.post('/gif2mp4', upload.single('file'), async (req, res) => {
  const gifPattern = /\.gif$/;
  const fileName = req.file?.originalname as string;
  if (!gifPattern.test(fileName)) {
    res.sendStatus(400);
    return;
  }

  const uniqueFileName = `${uuidV4()}-${fileName}`;
  const fileNameOutput = fileName.replace(gifPattern, '.mp4');
  const uniqueFileNameOutput = uniqueFileName.replace(gifPattern, '.mp4');
  const fileBuffer = req.file?.buffer as Buffer;
  ffmpeg.FS('writeFile', uniqueFileName, await fetchFile(fileBuffer));
  // ffmpeg -i animated.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" video.mp4
  await ffmpeg.run(
    '-i',
    uniqueFileName,
    '-movflags',
    'faststart',
    '-pix_fmt',
    'yuv420p',
    '-vf',
    'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    uniqueFileNameOutput,
  );
  const f = ffmpeg.FS('readFile', uniqueFileNameOutput);
  const b = Buffer.from(f);
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Length', b.byteLength);
  res.setHeader('Content-Disposition', `filename=${fileNameOutput}`);

  await streamPromises.pipeline(
    stream.Readable.from(b), //
    res,
  );

  await ffmpeg.FS('unlink', uniqueFileName);
  await ffmpeg.FS('unlink', uniqueFileNameOutput);
});

app.post('/gif2mp4-concurrent', upload.single('file'), async (req, res) => {
  const gifPattern = /\.gif$/;
  const fileName = req.file?.originalname as string;
  if (!gifPattern.test(fileName)) {
    res.sendStatus(400);
    return;
  }

  const uniqueFileName = `${uuidV4()}-${fileName}`;
  const fileNameOutput = fileName.replace(gifPattern, '.mp4');
  const uniqueFileNameOutput = uniqueFileName.replace(gifPattern, '.mp4');
  const fileBuffer = req.file?.buffer as Buffer;
  const worker = await pool.proxy();
  const b: Uint8Array = await worker.gif2mp4(fileBuffer);

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Length', b.byteLength);
  res.setHeader('Content-Disposition', `filename=${fileNameOutput}`);

  await streamPromises.pipeline(
    stream.Readable.from(Buffer.from(b)), //
    res,
  );
});

export default app;
