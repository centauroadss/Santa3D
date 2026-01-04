import React, { useState, useEffect } from 'react';
import { 
  Box, 
  ChevronRight, 
  Star, 
  Shield, 
  Zap, 
  Layout, 
  Users, 
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Layout className="w-6 h-6 text-red-500" />,
      title: "Panel Administrativo",
      description: "Control total sobre los participantes, categorías y resultados en tiempo real."
    },
    {
      icon: <Users className="w-6 h-6 text-red-500" />,
      title: "Gestión de Jurados",
      description: "Interfaz optimizada para que los jueces califiquen de forma rápida y sencilla."
    },
    {
      icon: <Zap className="w-6 h-6 text-red-500" />,
      title: "Resultados Instantáneos",
      description: "Algoritmos de cálculo automático para determinar ganadores sin errores manuales."
    },
    {
      icon: <Shield className="w-6 h-6 text-red-500" />,
      title: "Seguridad 3D",
      description: "Protección de datos y backups constantes para garantizar la integridad del evento."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-red-100 selection:text-red-900">
      {/* Navegación */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-200 group-hover:scale-110 transition-transform">
              <Box className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-800">Santa<span className="text-red-600">3D</span></span>
          </div>

          {/* Menú Escritorio */}
          <div className="hidden md:flex items-center gap-10">
            <div className="flex gap-8 items-center text-sm font-semibold text-slate-600">
              <a href="#inicio" className="hover:text-red-600 transition-colors">Inicio</a>
              <a href="#caracteristicas" className="hover:text-red-600 transition-colors">Características</a>
              <a href="#contacto" className="hover:text-red-600 transition-colors">Contacto</a>
            </div>
            <button className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-red-600 transition-all active:scale-95 shadow-xl shadow-slate-200">
              Acceder al Portal
            </button>
          </div>

          {/* Botón Móvil */}
          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Menú Móvil */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-100 p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-300 md:hidden">
            <a href="#inicio" className="text-xl font-bold text-slate-800" onClick={() => setIsMenuOpen(false)}>Inicio</a>
            <a href="#caracteristicas" className="text-xl font-bold text-slate-800" onClick={() => setIsMenuOpen(false)}>Características</a>
            <button className="bg-red-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-red-100">Iniciar Sesión</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="relative pt-40 pb-24 overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-100/50 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-0 right-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full text-slate-600 text-xs font-bold mb-10 shadow-sm uppercase tracking-widest">
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            Lanzamiento Oficial 2025
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tight leading-[0.9]">
            El estándar para <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-orange-500">concursos 3D</span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Automatiza la calificación de tus eventos, gestiona jurados y obtén resultados en tiempo real con nuestra tecnología de precisión.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-red-600 transition-all shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 group">
              Crear mi Evento
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 px-10 py-5 rounded-2xl font-bold text-lg hover:border-slate-400 transition-all flex items-center justify-center gap-2">
              Explorar Demo
            </button>
          </div>
          
          {/* Mockup del Dashboard */}
          <div className="mt-24 relative mx-auto max-w-6xl group px-4">
             <div className="absolute -inset-1 bg-gradient-to-b from-red-400 to-transparent rounded-[3rem] blur-2xl opacity-10"></div>
             <div className="relative bg-slate-900 rounded-[2.5rem] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-white/10">
                <div className="bg-slate-800/50 rounded-[2rem] h-[350px] md:h-[550px] overflow-hidden flex flex-col">
                    {/* Barra de herramientas simulada */}
                    <div className="h-12 bg-slate-800 flex items-center px-6 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Box size={100} className="text-white/5 mx-auto mb-6 animate-bounce" />
                            <h4 className="text-white/20 font-bold text-2xl uppercase tracking-[0.3em]">System Interface</h4>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900">Potencia sin <span className="text-red-600">complicaciones.</span></h2>
              <p className="text-slate-500 text-lg">Hemos diseñado cada herramienta pensando en la experiencia del usuario y la integridad de los datos.</p>
            </div>
            <div className="flex gap-4">
               <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-400">Trusted by +50 Events</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-slate-50 border border-transparent hover:border-red-200 hover:bg-white transition-all duration-500 group">
                <div className="mb-8 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 transition-all">
                  {React.cloneElement(f.icon, { className: "w-8 h-8 transition-colors" })}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-800">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Box className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black text-slate-800">Santa3D</span>
            </div>
            
            <div className="flex gap-10 text-sm font-bold text-slate-400">
              <a href="#" className="hover:text-red-600 transition-colors uppercase tracking-widest">Twitter</a>
              <a href="#" className="hover:text-red-600 transition-colors uppercase tracking-widest">Instagram</a>
              <a href="#" className="hover:text-red-600 transition-colors uppercase tracking-widest">LinkedIn</a>
            </div>

            <div className="text-sm font-medium text-slate-400">
              © 2025 Santa3D. Hecho con ❤️ para la comunidad.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;