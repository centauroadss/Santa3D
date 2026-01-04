import type { Metadata } from 'next'
import Link from 'next/link';
import './globals.css'
export const metadata: Metadata = {
  title: 'Concurso Santa 3D Venezolano | @centauroads',
  description: 'Crea un Santa 3D tan criollo como tú. Premio: $600 USD + Proyección en pantalla outdoor de 10 metros en Chacao.',
  keywords: 'concurso, 3D, animación, Venezuela, Santa, Navidad, Centauro ADS',
  authors: [{ name: 'Centauro ADS' }],
  openGraph: {
    title: 'Concurso Santa 3D Venezolano',
    description: 'Participa y gana $600 USD + proyección en pantalla gigante',
    type: 'website',
  },
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-VE">
      <body className="font-arquitecta antialiased flex flex-col min-h-screen bg-[#050505] text-white">
        {/* Global Header */}
        <header className="w-full border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 h-28 flex items-center justify-between">
            {/* Logo Centauro */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <img
                  src="/centauro-logo.png"
                  alt="Centauro ADS Logo"
                  className="h-20 w-auto object-contain"
                />
                <span className="text-[10px] text-white font-bold tracking-widest uppercase mt-1 drop-shadow-md">Visibilidad que conecta</span>
              </div>
              <div className="hidden md:flex flex-col border-l border-gray-700 pl-4 ml-4 justify-center">
                <h1 className="font-black text-white text-xl leading-none tracking-tight drop-shadow-md">CONCURSO SANTA 3D</h1>
                <span className="font-bold text-white text-lg tracking-[0.2em] leading-tight drop-shadow-md">VENEZOLANO</span>
              </div>
            </div>
            {/* Navigation */}
            <div className="flex items-center gap-6 text-sm font-bold uppercase tracking-widest text-gray-400">
              <a href="/#premios" className="hidden md:block hover:text-white transition-colors">Premios</a>
              <a href="/#ranking" className="hidden md:block hover:text-white transition-colors">Ranking</a>
              <Link
                href="/admin/login"
                className="text-white/60 hover:text-white font-medium text-sm tracking-widest uppercase transition-colors"
              >
                Administración
              </Link>
              <Link
                href="/jueces/login"
                className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-bold text-sm tracking-widest uppercase transition-all"
              >
                Votación Jueces
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-grow">
          {children}
        </main>
        {/* Global Footer */}
        <footer className="w-full border-t border-white/10 bg-black py-12">
          <div className="container mx-auto px-4 text-center">
            <img
              src="/centauro-logo.png"
              alt="Centauro ADS Logo"
              className="h-10 w-auto object-contain mx-auto mb-6 opacity-50 grayscale hover:grayscale-0 transition-all"
            />
            <p className="text-gray-500 mb-4">
              ¿Tienes alguna duda sobre el concurso?
            </p>
            <a
              href="mailto:mercadeo@centauroads.com"
              className="text-xl font-bold text-white hover:text-red-500 transition-colors inline-flex items-center gap-2"
            >
              📧 mercadeo@centauroads.com
            </a>
            <p className="text-xl font-bold text-white mt-1 animate-pulse">
              ¡somos @centauroads...visibilidad que conecta!
            </p>
            <div className="mt-8 flex justify-center gap-8 text-sm text-gray-600 uppercase tracking-widest font-bold">
              <a href="/condiciones" className="hover:text-white transition-colors">Términos y Condiciones</a>
              <span>•</span>
              <a href="https://centauroads.com" target="_blank" className="hover:text-white transition-colors">Web Oficial</a>
            </div>
            <p className="text-gray-700 text-xs mt-8">
              © {new Date().getFullYear()} Centauro ADS. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
