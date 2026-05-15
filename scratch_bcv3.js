async function run() {
  const res = await fetch('https://www.bcv.org.ve/');
  const t = await res.text();
  const index = t.indexOf('USD');
  console.log("HTML around USD:", t.substring(index - 200, index + 200));
}
run();
