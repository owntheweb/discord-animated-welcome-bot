import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { MessageResponder } from './services/message-responder';
import { PingFinder } from './services/ping-finder';
import { GuildGreeter } from './services/guild-greeter';
import { ArccorpGreeting } from './services/greetings/sc/arccorp-greeting';
import { CanvasHelper } from './services/canvas-helper';
import { Bot } from './bot';
import { Client } from 'discord.js';

const container = new Container();

container.bind<Bot>(TYPES.Bot).to(Bot).inSingletonScope();

container.bind<MessageResponder>(TYPES.MessageResponder).to(MessageResponder).inSingletonScope();
container.bind<PingFinder>(TYPES.PingFinder).to(PingFinder).inSingletonScope();
container.bind<GuildGreeter>(TYPES.GuildGreeter).to(GuildGreeter).inSingletonScope();
container.bind<ArccorpGreeting>(TYPES.ArccorpGreeting).to(ArccorpGreeting).inSingletonScope();
container.bind<CanvasHelper>(TYPES.CanvasHelper).to(CanvasHelper).inSingletonScope();

container.bind<Client>(TYPES.Client).toConstantValue(new Client());
container.bind<string>(TYPES.Token).toConstantValue(process.env.TOKEN);

export { container };