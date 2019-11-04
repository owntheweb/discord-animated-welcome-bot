import { GuildMember, TextChannel, Message, Attachment, RichEmbed } from 'discord.js';
import { inject, injectable } from 'inversify';
import { ArccorpGreeting } from './greetings/sc/arccorp-greeting';
import { TYPES } from '../types';

// TODO: Not TypeScript friendly, work through this.
// There's a @type/promise-queue
// Maybe a better way to queue tasks at this point?
const Queue = require('promise-queue'); // tslint:disable-line

@injectable()
export class GuildGreeter {

  // TODO: Determine how a guild admin can set this, make static to start
  // TODO: Would also need to save these types of preferences
  private channelName = 'welcome';

  // Handle animated greetings one at a time
  // TODO: Consider allowing setting of max concurrent for more performant bot servers
  private queueMaxConcurrent = 1;
  private queueMaxCount = Infinity;
  private queue: any; // TODO eww, see above

  constructor(@inject(TYPES.ArccorpGreeting) private arccorpGreeting: ArccorpGreeting) {
    this.queue = new Queue(this.queueMaxConcurrent, this.queueMaxCount);
  }

  public handle(member: GuildMember): Promise<Message | Message[]> {
    const channel = this.findTextBasedChannel(this.channelName, member);
    if (channel) {
      return this.queue.add(() => {
        return this.arccorpGreeting.generateGreetingAttachment(member);
      })
      .then((attachment: Attachment) => {
        return channel.send(this.createRichEmbedResponse(member, attachment));
      })
      .catch((err) => {
        console.log(err);
        return Promise.reject();
      });
    }
    return Promise.reject();
  }

  private createRichEmbedResponse(member: GuildMember, attachment: Attachment): RichEmbed {
    const exampleEmbed = new RichEmbed()
      .setColor('#50a0b3')
      .attachFiles([attachment])
      .setImage('attachment://welcome.gif')
      .setDescription(`Welcome to the corp, ${member}!`);

    return exampleEmbed;
  }

  private findTextBasedChannel(channelName: string, guildMember: GuildMember): TextChannel {
    const guildChannel = guildMember.guild.channels.find(ch => ch.name === channelName);
    if (!guildChannel) return;
    return guildChannel as TextChannel;
  }
}