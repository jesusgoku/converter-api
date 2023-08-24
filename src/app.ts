import stream from 'node:stream';
import streamPromises from 'node:stream/promises';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidV4 } from 'uuid';
import workerpool from 'workerpool';
import { sendVideo } from './telegram';

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

app.post('/gif2mp4-send2telegram', upload.single('file'), async (req, res) => {
  const gifPattern = /\.gif$/;
  const fileName = req.file?.originalname as string;
  if (!gifPattern.test(fileName)) {
    res.sendStatus(400);
    return;
  }

  const { chatId, caption } = req.body;

  const fileBuffer = req.file?.buffer as Buffer;
  const worker = await pool.proxy();
  const video: Uint8Array = await worker.gif2mp4(fileBuffer);
  const videoBuffer = Buffer.from(video);

  const result = await sendVideo({
    chatId,
    video: videoBuffer,
    videoName: fileName,
    caption,
  });

  if (result.error_code) {
    res.status(result.error_code).json(result);
  } else {
    res.sendStatus(204);
  }
});

export default app;
