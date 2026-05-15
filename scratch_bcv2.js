async function run() {
  const res = await fetch('https://www.bcv.org.ve/');
  const t = await res.text();
  const matchValue = t.match(/id="dolar".*?<strong>(.*?)<\/strong>/is);
  console.log("HTML:", matchValue ? matchValue[0] : "not found");
}
run();
