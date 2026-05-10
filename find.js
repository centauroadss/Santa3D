const fs=require('fs');
const path=require('path');
function walk(dir) {
  let results=[];
  const list=fs.readdirSync(dir);
  list.forEach(file => {
    file=path.join(dir,file);
    let stat;
    try { stat = fs.statSync(file); } catch(e) { return; }
    if(stat && stat.isDirectory()) {
      if(!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git') && !file.includes('docs')) {
        results=results.concat(walk(file));
      }
    } else {
      if(file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}
const files=walk('.');
files.forEach(f => {
  const c=fs.readFileSync(f, 'utf8');
  if(c.includes('\\`') || c.includes('\\${')) {
    console.log(f);
  }
});
