import util from 'node:util';
import http from 'node:http';
import app from './app';
import { PORT } from './config';

const server = http.createServer(app);

const listen = util.promisify(server.listen).bind(server) as (port: string | number) => Promise<void>;
// server.listen(PORT, () => {
//   console.log(`Listen on: http://0.0.0.0:${PORT}`);
// });

(async function () {
  await listen(PORT);
  console.log(`Listen on: http://0.0.0.0:${PORT}`);
})();
