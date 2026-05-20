const { syncBcv } = require('./lib/copa2026/bcv-sync');

async function main() {
    try {
        const result = await syncBcv();
        console.log("Sync Result:", result);
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
