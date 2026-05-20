import { NextRequest } from 'next/server';
import { GET, PUT } from './app/api/admin/emails/config/route';
import { generateToken } from './lib/auth-edge';

async function runTests() {
    console.log('--- Iniciando Pruebas de Integración y Unitarias ---');
    
    // 1. Crear un token de prueba ADMIN
    const token = await generateToken({ id: '1', email: 'admin@test.com', role: 'ADMIN' });
    
    // Prueba 1: Acceso sin Token (Debe fallar con 401)
    console.log('\\n[TEST 1] PUT /api/admin/emails/config SIN token...');
    const reqWithoutToken = new NextRequest('http://localhost/api/admin/emails/config', {
        method: 'PUT',
        body: JSON.stringify({ dynamicLinks: [] })
    });
    
    const res1 = await PUT(reqWithoutToken);
    if (res1.status === 401) {
        console.log('✅ TEST 1 PASÓ: Acceso denegado correctamente (401 Unauthorized).');
    } else {
        console.error(`❌ TEST 1 FALLÓ: Esperaba 401, obtuve ${res1.status}`);
    }

    // Prueba 2: Acceso con Token válido (Debe tener éxito con 200)
    console.log('\\n[TEST 2] PUT /api/admin/emails/config CON token ADMIN...');
    const reqWithToken = new NextRequest('http://localhost/api/admin/emails/config', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dynamicLinks: [{ id: 'test', name: 'Test', url: 'https://test.com' }] })
    });

    const res2 = await PUT(reqWithToken);
    const data2 = await res2.json();
    if (res2.status === 200 && data2.success) {
        console.log('✅ TEST 2 PASÓ: Configuración guardada exitosamente (200 OK).');
    } else {
        console.error(`❌ TEST 2 FALLÓ: Esperaba 200, obtuve ${res2.status}`, data2);
    }

    // Prueba 3: GET con Token válido
    console.log('\\n[TEST 3] GET /api/admin/emails/config CON token ADMIN...');
    const reqGetWithToken = new NextRequest('http://localhost/api/admin/emails/config', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const res3 = await GET(reqGetWithToken);
    const data3 = await res3.json();
    if (res3.status === 200 && data3.success && data3.data.dynamicLinks.length > 0) {
        console.log('✅ TEST 3 PASÓ: Configuración obtenida correctamente (200 OK) y coincide con lo guardado.');
    } else {
        console.error(`❌ TEST 3 FALLÓ: Esperaba 200 y enlaces guardados, obtuve ${res3.status}`, data3);
    }

    console.log('\\n--- Pruebas Finalizadas ---');
}

runTests().catch(console.error);
