const http = require('http');

const loginData = {
    "0": {
        "json": {
            "email": "centauroadss@gmail.com",
            "password": "MERcentads2026!."
        }
    }
};

const req = http.request("http://localhost:3000/api/trpc/auth.login?batch=1", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    }
}, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            const token = parsed[0].result.data.json.token;
            console.log("Got token");

            const deployData = {
                "0": {
                    "json": {
                        "projectName": "project",
                        "serviceName": "copa2026"
                    }
                }
            };

            const req2 = http.request("http://localhost:3000/api/trpc/services.deployApp?batch=1", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }, (res2) => {
                let data2 = '';
                res2.on('data', d => data2 += d);
                res2.on('end', () => {
                    console.log("Deploy response:", data2);
                });
            });
            req2.write(JSON.stringify(deployData));
            req2.end();
        } catch(e) {
            console.error("Error", e, data);
        }
    });
});
req.write(JSON.stringify(loginData));
req.end();
