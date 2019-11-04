// helpful refs:
// https://www.toptal.com/typescript/dependency-injection-discord-bot-tutorial
// http://blog.wolksoftware.com/dependency-injection-in-typescript-applications-powered-by-inversifyjs
// https://itnext.io/typescript-dependency-injection-setting-up-inversifyjs-ioc-for-a-ts-project-f25d48799d70

require('dotenv').config(); // Recommended way of loading dotenv
import { container } from './inversify.config';
import { TYPES } from './types';
import { Bot } from './bot';
const bot = container.get<Bot>(TYPES.Bot);
bot.listen().then(() => {
  console.log('Logged in!');
}).catch((error) => {
  console.log('Oh no! ', error);
});
