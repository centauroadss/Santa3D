const xlsx = require('xlsx');

try {
  const workbook = xlsx.readFile('C:\\Users\\joaou\\OneDrive\\Documentos\\Tabla historicxa TC OFICIAL BCV.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: null });
  
  console.log(`Total rows: ${data.length}`);
  if (data.length > 0) {
    console.log("First 3 rows:");
    console.log(JSON.stringify(data.slice(0, 3), null, 2));
    console.log("Last 5 rows:");
    console.log(JSON.stringify(data.slice(-5), null, 2));
  }
} catch (e) {
  console.error("Error reading file:", e.message);
}
