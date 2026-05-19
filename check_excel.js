import * as xlsx from 'xlsx';

try {
  const filePath = 'C:\\\\Users\\\\joaou\\\\OneDrive\\\\Documentos\\\\Tabla historica TC OFICIAL BCV.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: true });
  console.log("Total filas:", data.length);
  console.log(data.slice(0, 20));
} catch(e) {
  console.error("Error:", e);
}
