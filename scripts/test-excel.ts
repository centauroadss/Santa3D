import * as xlsx from 'xlsx';

const filePath = 'C:\\Users\\joaou\\OneDrive\\Documentos\\Tabla historica TC OFICIAL BCV.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: true });

console.log('Columns and first 3 rows:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));
