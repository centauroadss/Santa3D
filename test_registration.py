import requests
from io import BytesIO

# Generate a tiny dummy PNG
image_data = BytesIO(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDAT\x08\xd7c\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa7\x35\x81\x84\x00\x00\x00\x00IEND\xaeB`\x82')

url = "https://santa3d.centauroads.com/api/copa2026/inscripcion"
payload = {
    "nombre": "Test",
    "apellidos": "User",
    "cedulaIdentidad": "V-12345678",
    "fechaNacimiento": "1990-01-01",
    "biografia": "Test bio",
    "pais": "Venezuela",
    "estado": "Caracas",
    "ciudad": "Caracas",
    "categoria": "JUNIOR_ROOKIE",
    "genero": "MASCULINO",
    "telefono": "04141234567",
    "instagram": "@test",
    "nombreRepresentante": "",
    "cedulaRepresentante": "",
    "telefonoRepresentante": "",
    "emailContacto": "test@example.com",
    "metodoPago": "PAGO_MOVIL",
    "bancoEmisor": "BANESCO",
    "referenciaPago": "123456",
    "fechaPago": "2026-05-18",
    "aceptaTerminos": "true"
}

files = {
    'fotoPerfil': ('foto.png', image_data, 'image/png'),
    'comprobantePago': ('comp.png', image_data, 'image/png')
}

print("Sending POST to", url)
headers = {'Host': 'santa3d.centauroads.com'}
response = requests.post(url, data=payload, files=files, headers=headers, verify=False)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
