require('ts-node/register');
const { getTasaDelDia } = require('./lib/copa2026/bcv');

async function test() {
    try {
        console.log('Testing getTasaDelDia()...');
        const rate = await getTasaDelDia();
        console.log('Success! Rate is:', rate);
    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        process.exit(0);
    }
}
test();
