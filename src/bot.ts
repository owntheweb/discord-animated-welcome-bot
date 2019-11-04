import { Client, Message, GuildMember } from 'discord.js';
import { inject, injectable } from 'inversify';
import { TYPES } from './types';
import { MessageResponder } from './services/message-responder';
import { GuildGreeter } from './services/guild-greeter';

@injectable()
export class Bot {

  constructor(
    @inject(TYPES.Client) private client: Client,
    @inject(TYPES.Token) private token: string,
    @inject(TYPES.MessageResponder) private messageResponder: MessageResponder,
    @inject(TYPES.GuildGreeter) private guildGreeter: GuildGreeter) {
    this.client = client;
    this.token = token;
    this.messageResponder = messageResponder;
  }

  public listen(): Promise<string> {
    // TODO: pretend this is a new guild member for testing at this time...
    this.client.on('message', async (message: Message) => {
      // ignore bot messages
      if (message.author.bot) {
        return;
      }

      console.log(`Message received! Contents: ${message.content}`);

      this.messageResponder.handle(message).then(() => {
        console.log('Ping response sent!');
      }).catch(() => {
        // console.log('Response not sent.');
      });

      // TEMP: Get a welcome image with !join command for testing purposes
      if (message.content === '!join') {
        this.client.emit(
          'guildMemberAdd', message.member ||
          await message.guild.fetchMember(message.author)
        );
      }
    });

    this.client.on('guildMemberAdd', (newMember: GuildMember) => {
      console.log('guildMemberAdd emitted');

      this.guildGreeter.handle(newMember).then(() => {
        console.log('New member greeted!');
      }).catch(() => {
        console.log('No greeting sent.');
      });
    });

    return this.client.login(this.token);
  }
}
