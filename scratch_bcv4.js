async function run() {
  const res = await fetch('https://api.allorigins.win/get?url=https://www.bcv.org.ve/');
  const json = await res.json();
  const t = json.contents;
  const index = t.indexOf('USD');
  console.log("HTML around USD via proxy:", t.substring(index - 200, index + 200));
}
run();
