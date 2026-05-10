fetch('https://api.allorigins.win/get?url=https://www.bcv.org.ve/')
  .then(r => r.json())
  .then(d => {
    const match = d.contents.match(/<div id="dolar">.*?<strong>(.*?)<\/strong>/is);
    const val = match ? match[1].trim().replace(',', '.') : 'Not found';
    console.log('BCV Scraped via AllOrigins:', val);
  })
  .catch(console.error);
