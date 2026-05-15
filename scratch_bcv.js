async function run() {
  const res = await fetch('https://www.bcv.org.ve/');
  const t = await res.text();
  const matchValue = t.match(/id="dolar".*?<strong>\s*([\d,]+)\s*<\/strong>/is);
  const matchDate = t.match(/Fecha Valor:.*?content="([^"]+)"/is);
  console.log("USD:", matchValue ? matchValue[1] : "not found");
  console.log("Date:", matchDate ? matchDate[1] : "not found");
}
run();
