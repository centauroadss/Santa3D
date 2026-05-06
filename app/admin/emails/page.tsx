import EmailClient from './EmailClient';
import EmailConfigAndLogs from './EmailConfigAndLogs';

export const metadata = {
    title: 'Plantillas de Correo y Automatización | Admin Santa 3D',
};

export default function EmailsAdminPage() {
    return (
        <div className="max-w-6xl mx-auto">
            <EmailClient />
            <EmailConfigAndLogs />
        </div>
    );
}
