import { EmailService } from '../lib/email-service';
import dotenv from 'dotenv';
dotenv.config();
async function main() {
    console.log('🚀 Iniciando Prueba de Email...');
    const targetEmail = 'joaoucab@gmail.com'; 
    console.log(`📨 Intentando enviar a: ${targetEmail}`);
    try {
        const result = await EmailService.send({
            to: targetEmail,
            subject: 'DIAGNOSTICO FINAL',
            html: '<h1>Sistema Operativo</h1><p>Sandbox Activo.</p>'
        });
        if (result.success) {
            console.log('✅ ÉXITO.');
        } else {
            console.error('❌ FALLO:', result.error);
        }
    } catch (e) {
        console.error('❌ EXCEPCIÓN:', e);
    }
}
main();
