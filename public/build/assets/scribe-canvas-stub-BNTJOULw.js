const unavailable = () => {
  throw new Error("@scribe.js/canvas is not available in the browser");
};
const createCanvas = unavailable;
const loadImage = async () => unavailable();
const registerFont = () => {
};
class Canvas {
  constructor() {
    unavailable();
  }
}
class Image {
  constructor() {
    unavailable();
  }
}
const scribeCanvasStub = { createCanvas, loadImage, registerFont, Canvas, Image };
export {
  Canvas,
  Image,
  createCanvas,
  scribeCanvasStub as default,
  loadImage,
  registerFont
};
//# sourceMappingURL=scribe-canvas-stub-BNTJOULw.js.map
