import { inject, injectable } from 'inversify';
import { createCanvas, loadImage, Image } from 'canvas';
import { Attachment, GuildMember} from 'discord.js';
import { TYPES } from '../../../types';
import { CanvasHelper } from '../../canvas-helper';
import * as gifEncoder from 'gif-encoder'; // TODO: Not TypeScript-friendly at this time

@injectable()
export class ArccorpGreeting {
  private canvasWidth = 700;
  private canvasHeight = 205;
  private encoder: any;
  private gifRepeat = 0; // 0 for repeat, -1 for no-repeat
  private gifDelay = 42; // frame delay in ms
  private gifQuality = 15; // image quality. 10 is default.
  private backFrameCount = 44;
  private backPath = 'src/assets/backgrounds/arccorp/';
  private backFilePrefix = 'arccorp';
  private backFileSuffix = '.png';
  private avatarWidth = 80;
  private avatarBorderWidth = 2;
  private backgroundImages: Image[] = [];
  private canvas: any;
  private ctx: any;

  constructor(@inject(TYPES.CanvasHelper) private canvasHelper: CanvasHelper) {
  }

  private setupCanvas(): void {
    this.canvas = createCanvas(this.canvasWidth, this.canvasHeight);
    this.ctx = this.canvas.getContext('2d', { alpha: true });
  }

  private async preloadBackgroundSequence(): Promise<boolean> {
    // create a numbered array for load iteration
    const countArray = Array
        .apply(null, { length: this.backFrameCount })
        .map(Number.call, Number);

    // load and add animation frames if not preloaded already
    if (this.backgroundImages.length === 0) {
      for (const i of countArray) {
        const frame = i.toString().padStart(2, '0');
        const backgroundFile = `${this.backPath}${this.backFilePrefix}${frame}${this.backFileSuffix}`;
        const image = await loadImage(backgroundFile);
        this.backgroundImages.push(image);
      }
    }
    return true;
  }

  private initEncoder(): void {
    this.encoder = new gifEncoder(this.canvas.width, this.canvas.height);
    this.encoder.setRepeat(this.gifRepeat);   // 0 for repeat, -1 for no-repeat
    this.encoder.setDelay(this.gifDelay);  // frame delay in ms
    this.encoder.setQuality(this.gifQuality); // image quality. 10 is default.
    this.encoder.writeHeader();
  }

  private attachmentPromise(): Promise<Attachment> {
    const buffers: Buffer[] = [];
    const attachment: Promise<Attachment> = new Promise((resolve, reject) => {
      this.encoder.on('data', (buffer: Buffer) => {
        buffers.push(buffer);
      });
      this.encoder.on('end', () => {
        console.log('stream complete!');
        resolve(new Attachment(Buffer.concat(buffers), 'welcome.gif'));
      });
      this.encoder.on('error', err => {
        console.log(err);
        reject(err);
      });
    });
    return attachment;
  }

  /**
   * Generate the animated greeting Gif that will be the reply attachment
   */
  public async generateGreetingAttachment(member: GuildMember): Promise<Attachment> {
    this.setupCanvas();
    this.initEncoder();
    const attachment = this.attachmentPromise();
    await this.preloadBackgroundSequence();
    const avatarImage:Image = await loadImage(member.user.displayAvatarURL);
    this.captureFrames(member, avatarImage);
    this.encoder.finish();
    return attachment;
  }

  private captureFrames(member: GuildMember, avatarImage: Image): void {
    const countArray = Array
        .apply(null, { length: this.backFrameCount })
        .map(Number.call, Number);

    console.log(`capturing frames...`);
    for (const i of countArray) {
      this.drawFrame(i, member, avatarImage);
      const pixels = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
      this.encoder.addFrame(pixels);
    }
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawBackground(frameNum: number): void {
    this.ctx.drawImage(this.backgroundImages[frameNum], 0, 0, this.canvas.width, this.canvas.height);
  }

  // darken the background a touch for text to pop
  // thanks: http://victorblog.com/html5-canvas-gradient-creator/
  private drawBackgroundOverlay(): void {
    // Create gradient
    const grd = this.ctx.createLinearGradient(0.000, 150.000, 300.000, 150.000);

    // Add colors
    grd.addColorStop(0.000, 'rgba(30, 70, 81, 0.400)');
    grd.addColorStop(0.348, 'rgba(30, 70, 81, 0.000)');
    grd.addColorStop(0.652, 'rgba(30, 70, 81, 0.000)');
    grd.addColorStop(0.982, 'rgba(30, 70, 81, 0.400)');

    // Fill with gradient
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // an extra stylisting circle bordering the border...
  private drawAvatarBorderOuter(): void {
    this.ctx.strokeStyle = 'rgba(205,247,247,0.7)';
    this.ctx.beginPath();
    this.ctx.arc(
      (this.canvas.width / 2), // x
      (this.canvas.height / 2), // y
      (this.avatarWidth / 2) + (this.avatarBorderWidth + 5), // radius
      0, // start angle
      Math.PI * 2); // end angle
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private drawAvatarBorder(): void {
    this.ctx.fillStyle = 'rgba(205,247,247,0.7)';
    this.ctx.beginPath();
    this.ctx.arc(
      (this.canvas.width / 2), // x
      (this.canvas.height / 2), // y
      (this.avatarWidth / 2) + this.avatarBorderWidth, // radius
      0, // start angle
      Math.PI * 2); // end angle
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawAvatarClippingMask(): void {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(
      (this.canvas.width / 2), // x
      (this.canvas.height / 2), // y
      (this.avatarWidth / 2), // radius
      0, // start angle
      Math.PI * 2); // end angle
    this.ctx.closePath();
    this.ctx.clip();
  }

  private async drawAvatar(avatarImage: Image): Promise<void> {
    const posX = (this.canvas.width / 2) - (this.avatarWidth / 2);
    const posY = (this.canvas.height / 2) - (this.avatarWidth / 2);
    this.ctx.drawImage(avatarImage, posX, posY, this.avatarWidth, this.avatarWidth);
  }

  // thanks: http://victorblog.com/html5-canvas-gradient-creator/
  private drawAvatarGlow(): void {
    const posX = (this.canvas.width / 2) - (this.avatarWidth / 2);
    const posY = (this.canvas.height / 2) - (this.avatarWidth / 2);

    // Create gradient
    const grd = this.ctx.createRadialGradient(
        (this.canvas.width / 2),
        (this.canvas.height / 2),
        0,
        (this.canvas.width / 2),
        (this.canvas.height / 2),
        (this.avatarWidth / 2));

    // Add colors
    grd.addColorStop(0.6, 'rgba(213, 253, 253, 0.000)');
    grd.addColorStop(1.000, 'rgba(213, 253, 253, 0.400)');

    // Fill with gradient
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(posX, posY, this.avatarWidth, this.avatarWidth);
    this.ctx.restore();
  }

  // thanks: https://discordjs.guide/popular-topics/canvas.html#adding-in-text
  private applyText(text: string, initFontSize: number): void {
    // initial font size, will shrink if text is too long for canvas
    let fontSize = initFontSize;
    do {
      // assign the font to the context and decrement it so it can be measured again
      this.ctx.font = `${fontSize -= 10}px Roboto Medium`;
      // compare pixel width of the text to the canvas minus the approximate avatar size
    } while (this.ctx.measureText(text).width > this.canvas.width - 50);
  }

  private drawTextLine1(text: string): void {
    this.applyText(text, 40);
    this.ctx.fillStyle = 'rgb(205,247,247)';
    const posX = (this.canvas.width / 2) - (this.ctx.measureText(text).width / 2);
    this.ctx.fillText(text, posX, 35);
  }

  private drawTextLine2(text: string): void {
    this.applyText(text, 35);
    this.ctx.fillStyle = 'rgb(205,247,247)';
    const posX = (this.canvas.width / 2) - (this.ctx.measureText(text).width / 2);
    this.ctx.fillText(text, posX, this.canvas.height - 17);
  }

  private drawFrame(frameNum: number, member: GuildMember, avatarImage: Image): void {
    this.clearCanvas();
    this.drawBackground(frameNum);
    this.drawBackgroundOverlay();
    this.drawTextLine1(`${member.displayName}`);
    this.drawTextLine2(`Welcome To The Corp!`);
    this.drawAvatarBorderOuter();
    this.drawAvatarBorder();
    this.drawAvatarClippingMask();
    this.drawAvatar(avatarImage);
    this.drawAvatarGlow();
  }
}