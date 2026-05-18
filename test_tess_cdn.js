const { createWorker } = require('tesseract.js');
async function test() {
  try {
    const worker = await createWorker('spa', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js'
    });
    console.log('success');
    await worker.terminate();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
test();
