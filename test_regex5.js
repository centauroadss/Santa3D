const text = 'FECHA\\n06-05-2026';

function isValidDate(y, m, d) {
  if (y < 2024 || y > 2035) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return false;
  const hoyMas7 = new Date();
  hoyMas7.setDate(hoyMas7.getDate() + 7);
  if (date > hoyMas7) return false;
  return true;
}

const cand = { text: '06-05-2026', score: 10 };
let bestDate = null;
let bestScore = -1;

let cleaned = cand.text.replace(/\b(?:[0-2]?[0-9])[O0o:\.]+[0-5][0-9](?:[O0o:\.]+[0-5][0-9])?\s*(?:AM|PM|am|pm)?\b/ig, ' ');
cleaned = cleaned.replace(/[OoQq]/g, '0').replace(/[Il\|\.]/g, '/'); 

console.log("Cleaned:", cleaned);

const numPattern = /(\d{1,2})[\/\-]+(\d{1,2})[\/\-]+(\d{4}|\d{2})\b/g;
for (const match of cleaned.matchAll(numPattern)) {
  console.log("Matched!", match[0]);
  let y = parseInt(match[3], 10);
  if (y < 100) y += 2000; 
  let p1 = parseInt(match[1], 10);
  let p2 = parseInt(match[2], 10);
  console.log("y, p1, p2", y, p1, p2);
  
  if (isValidDate(y, p2, p1)) {
    console.log("Valid p2, p1");
    const ds = `${y}-${p2.toString().padStart(2, '0')}-${p1.toString().padStart(2, '0')}`;
    if (cand.score > bestScore) {
      bestScore = cand.score;
      bestDate = ds;
      console.log("Best Date updated to", bestDate);
    }
  } else if (isValidDate(y, p1, p2)) { 
     console.log("Valid p1, p2");
     const ds = `${y}-${p1.toString().padStart(2, '0')}-${p2.toString().padStart(2, '0')}`;
     if (cand.score > bestScore) {
       bestScore = cand.score;
       bestDate = ds;
       console.log("Best Date updated to", bestDate);
     }
  }
}
console.log("Final bestDate:", bestDate);
