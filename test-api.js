const loginData = { email: "centauroadss@gmail.com", password: "MERcentads2026!." };
fetch("https://copa2026.centauroads.com/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(loginData)
})
.then(r => r.json())
.then(res => {
  if (res.token) {
    return fetch("https://copa2026.centauroads.com/api/admin/bcv-historico", {
      headers: { "Authorization": `Bearer ${res.token}` }
    })
    .then(r => r.json())
    .then(r => console.log(JSON.stringify(r)));
  } else {
    console.log("No token", res);
  }
}).catch(console.error);
