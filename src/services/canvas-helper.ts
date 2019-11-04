import { registerFont } from 'canvas';
import { injectable } from 'inversify';

@injectable()
export class CanvasHelper {

  constructor() {
    this.registerFonts();
  }

  private registerFonts(): void {
    registerFont('src/assets/fonts/roboto/Roboto-Medium.ttf', { family: 'Roboto Medium' });
    registerFont('src/assets/fonts/roboto/Roboto-MediumItalic.ttf', { family: 'Roboto Medium Italic' }); // tslint:disable-line
    registerFont('src/assets/fonts/roboto/Roboto-Regular.ttf', { family: 'Roboto Regular' });
    registerFont('src/assets/fonts/rounded_elegance/Rounded_Elegance.ttf', { family: 'Rounded Elegance' }); // tslint:disable-line
  }
}
