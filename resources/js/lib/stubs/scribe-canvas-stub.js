// resources/js/lib/stubs/scribe-canvas-stub.js
// Browser stub for @scribe.js/canvas (native skia binaries can't be bundled).
// scribe.js-ocr uses its own browser code path, so this is never really called.

const unavailable = () => {
    throw new Error('@scribe.js/canvas is not available in the browser');
};

export const createCanvas = unavailable;
export const loadImage = async () => unavailable();
export const registerFont = () => {};

export class Canvas {
    constructor() {
        unavailable();
    }
}

export class Image {
    constructor() {
        unavailable();
    }
}

export default { createCanvas, loadImage, registerFont, Canvas, Image };