import requests
import io

url = "https://copa2026.centauroads.com/api/copa2026/inscripcion"

# Create dummy images
foto = io.BytesIO(b"fake image data")
foto.name = "foto.jpg"

comprobante = io.BytesIO(b"fake receipt data")
comprobante.name = "comprobante.png"

files = {
    'fotoPerfilFile': ('foto.jpg', foto, 'image/jpeg'),
    'comprobanteFile': ('comprobante.png', comprobante, 'image/png')
}

data = {
    'nombre': 'Test',
    'apellido': 'Usuario',
    'cedulaIdentidad': 'V-9999999',
    'email': 'test@example.com',
    'telefono': '04141234567',
    'instagram': '@testuser',
    'fechaNacimiento': '1990-01-01',
    'categoria': 'RENDER',
    'telefonoPago': '04141234567',
    'cedulaPago': 'V-9999999',
    'bancoOrigen': '0105',
    'referencia': '123456'
}

print("Enviando petición a:", url)
response = requests.post(url, data=data, files=files)
print("Status Code:", response.status_code)
print("Response:", response.text)
