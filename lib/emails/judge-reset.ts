import { sendEmail } from './utils';
export async function sendPasswordResetEmail(email: string, nameOrToken: string, password?: string) {
    const html = `<h1>Reset Password</h1><p>Hola ${nameOrToken}, tu nueva clave es ${password || 'Token'}</p>`;
    return await sendEmail({ to: email, subject: 'Restablecer Clave', html });
}
