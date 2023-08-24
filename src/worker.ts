import workerpool from 'workerpool';
import { v4 as uuidV4 } from 'uuid';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });

async function gif2mp4(fileBuffer: Buffer): Promise<Uint8Array> {
  const uniqueName = uuidV4();
  const uniqueFileName = `${uniqueName}.gif`;
  const uniqueFileNameOutput = `${uniqueName}.mp4`;

  !ffmpeg.isLoaded() && (await ffmpeg.load());
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

  await ffmpeg.FS('unlink', uniqueFileName);
  await ffmpeg.FS('unlink', uniqueFileNameOutput);

  return f;
}

workerpool.worker({
  gif2mp4,
});
