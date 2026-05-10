const loginData = { email: "centauroadss@gmail.com", password: "admin123" };
fetch("https://copa2026.centauroads.com/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(loginData)
})
.then(r => r.json())
.then(res => {
  if (res.token) {
    console.log("Logged in to admin!");
    return fetch("https://copa2026.centauroads.com/api/admin/clean-db", {
      method: "POST",
      headers: { "Authorization": `Bearer ${res.token}` }
    })
    .then(r => r.json())
    .then(r => {
        console.log("Clean DB response:", r);
        if(r.success) {
            console.log("✅ BASE DE DATOS LIMPIADA EXITOSAMENTE EN PRODUCCIÓN");
        }
    });
  } else {
    console.log("No token", res);
  }
}).catch(console.error);
