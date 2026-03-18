/**
 * Test VisionService with a valid JPEG.
 * Run: npx ts-node scripts/test-vision.ts
 */
import fs from 'fs';
import path from 'path';

// Minimal valid JPEG (1x1 pixel)
const VALID_JPEG_B64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQD/ALQH/9k=';
const testPath = path.join('/tmp', 'test_vision.jpg');
fs.writeFileSync(testPath, Buffer.from(VALID_JPEG_B64, 'base64'));

async function main() {
  const { VisionService } = await import('../src/services/engine/vision');
  const bot = { tenant: {} };
  try {
    const desc = await VisionService.analyze(testPath, undefined, bot);
    console.log('SUCCESS:', desc.substring(0, 100));
  } catch (e: any) {
    console.error('FAILED:', e.message);
  } finally {
    try { fs.unlinkSync(testPath); } catch {}
  }
}
main();
