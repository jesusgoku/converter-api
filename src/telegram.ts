import { v4 as uuidV4 } from 'uuid';
import fetch, { Blob } from 'node-fetch';
import FormData from 'form-data';
import { TELEGRAM_BOT_TOKEN } from './config';

export interface SendVideoOptions {
  chatId: string;

  video: Buffer;

  videoName?: string;

  caption?: string;
}

export async function sendVideo({ chatId, video, videoName: name, caption }: SendVideoOptions): Promise<any> {
  const body = new FormData();

  // const videoBlob = new Blob([video]);
  const videoName = name ?? `${uuidV4()}.mp4`;

  body.append('video', video, videoName);
  body.append('chat_id', chatId);
  body.append('parse_mode', 'MarkdownV2');
  caption && body.append('caption', caption);
  body.append('disable_notification', 'true');

  return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
    method: 'POST', //
    body,
  }).then((res) => res.json());
}
