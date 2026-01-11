import { useEffect, useRef, useState } from 'react';
import { 
  Search, Loader2, Send, CheckCircle, AlertCircle, FileText, Mail, 
  Zap, Shield, Clock, ChevronRight, Info, ExternalLink 
} from 'lucide-react';
import { portalApi } from './services/portalApi';
import type { Venta } from './types';
import InvoiceViewer from './components/InvoiceViewer';
import ErrorMessage from './components/ErrorMessage';

interface FacturacionRequest {
  folio: string;
  rfc: string;
  razonSocial: string;
  usoCfdi: string;
  regimenFiscal: string;
  email: string;
}

const USOS_CFDI = [
  { value: 'G01', label: 'G01 - Adquisición de mercancías' },
  { value: 'G02', label: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'I01', label: 'I01 - Construcciones' },
  { value: 'I02', label: 'I02 - Mobiliario y equipo de oficina' },
  { value: 'I03', label: 'I03 - Equipo de transporte' },
  { value: 'I04', label: 'I04 - Equipo de cómputo' },
];

const REGIMENES_FISCALES = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '612', label: '612 - Personas Físicas Actividades Empresariales' },
  { value: '613', label: '613 - Personas Físicas Actividades Agrícolas' },
  { value: '614', label: '614 - Personas Físicas sin Actividad Empresarial' },
  { value: '615', label: '615 - Régimen Simplificado de Confianza' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'buscar' | 'solicitar'>('buscar');
  const [folio, setFolio] = useState('');
  const [invoice, setInvoice] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FacturacionRequest>({
    folio: '',
    rfc: '',
    razonSocial: '',
    usoCfdi: 'G01',
    regimenFiscal: '601',
    email: ''
  });

  const lastFiscalLookupFolioRef = useRef<string>('');

  useEffect(() => {
    if (activeTab !== 'solicitar') return;

    const folioTrimmed = formData.folio.trim();
    if (!folioTrimmed) return;

    // Solo intentar autocompletar si falta RFC o razón social
    const needsRfc = !formData.rfc.trim();
    const needsRazonSocial = !formData.razonSocial.trim();
    if (!needsRfc && !needsRazonSocial) return;

    // Debounce para no disparar requests por cada tecla
    const handle = window.setTimeout(async () => {
      lastFiscalLookupFolioRef.current = folioTrimmed;

      const response = await portalApi.getTicketFiscalData(folioTrimmed);
      if (lastFiscalLookupFolioRef.current !== folioTrimmed) return;

      if (!response.success || !response.data) return;

      setFormData((prev) => ({
        ...prev,
        rfc: prev.rfc.trim() ? prev.rfc : (response.data?.rfc || ''),
        razonSocial: prev.razonSocial.trim() ? prev.razonSocial : (response.data?.razonSocial || ''),
      }));
    }, 400);

    return () => window.clearTimeout(handle);
  }, [activeTab, formData.folio, formData.rfc, formData.razonSocial]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folio.trim()) {
      setError('Por favor ingrese un número de ticket');
      return;
    }

    setLoading(true);
    setError('');
    setInvoice(null);

    const response = await portalApi.getInvoiceByFolio(folio.trim());

    if (!response.success || !response.data) {
      setError(response.error || 'No se encontró el ticket. Verifique el número.');
    } else {
      setInvoice(response.data);
    }

    setLoading(false);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.folio || !formData.rfc || !formData.razonSocial || !formData.email) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await portalApi.submitFacturacionRequest({
        folio: formData.folio.trim(),
        rfc: formData.rfc.trim().toUpperCase(),
        razonSocial: formData.razonSocial.trim(),
        usoCfdi: formData.usoCfdi,
        regimenFiscal: formData.regimenFiscal,
        email: formData.email.trim(),
      });

      if (!response.success) {
        setError(response.error || 'Ocurrió un error al enviar tu solicitud. Por favor intenta nuevamente.');
        return;
      }

      setSuccess(response.data?.message || '¡Solicitud enviada correctamente! Pronto recibirás tu factura en tu correo electrónico.');
      
      // Limpiar formulario
      setFormData({
        folio: '',
        rfc: '',
        razonSocial: '',
        usoCfdi: 'G01',
        regimenFiscal: '601',
        email: ''
      });
    } catch (err) {
      setError('Ocurrió un error al enviar tu solicitud. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Validar RFC
  const isValidRfc = (rfc: string) => {
    return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc.toUpperCase());
  };

  // Validar Email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo-portal.png"
                alt="AGRONARE"
                className="h-12 md:h-16 w-auto object-contain"
              />
            </div>
            <a href="#" className="text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1 text-sm font-medium">
              Soporte <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="container mx-auto px-4 py-12">
          {/* Tabs - Navigation */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {/* Tab 1: Download Ticket */}
              <button
                onClick={() => { setActiveTab('buscar'); setError(''); setSuccess(''); }}
                className={`group relative p-8 rounded-3xl border-2 transition-all duration-500 transform hover:scale-105 ${
                  activeTab === 'buscar'
                    ? 'border-emerald-600 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-xl shadow-emerald-300/30'
                    : 'border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-200/20'
                }`}
              >
                <div className="flex flex-col items-start gap-4">
                  <div className={`p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 ${activeTab === 'buscar' ? 'bg-emerald-200 shadow-lg shadow-emerald-400/30' : 'bg-emerald-100 group-hover:bg-emerald-200'}`}>
                    <Search className={`w-8 h-8 transition-colors duration-300 ${activeTab === 'buscar' ? 'text-emerald-800' : 'text-emerald-700 group-hover:text-emerald-800'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-bold text-xl transition-colors duration-300 ${activeTab === 'buscar' ? 'text-emerald-900' : 'text-slate-900 group-hover:text-emerald-900'}`}>
                      Descargar Ticket
                    </h3>
                    <p className={`text-sm mt-2 transition-colors duration-300 ${activeTab === 'buscar' ? 'text-emerald-700' : 'text-slate-600 group-hover:text-emerald-700'}`}>
                      Comprobante de compra en PDF
                    </p>
                  </div>
                </div>
                <ChevronRight className={`absolute top-1/2 -translate-y-1/2 right-6 w-7 h-7 transition-all duration-500 ${activeTab === 'buscar' ? 'text-emerald-700 opacity-100 translate-x-0' : 'text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-emerald-600'}`} />
              </button>

              {/* Tab 2: Request CFDI */}
              <button
                onClick={() => { setActiveTab('solicitar'); setError(''); setSuccess(''); }}
                className={`group relative p-8 rounded-3xl border-2 transition-all duration-500 transform hover:scale-105 ${
                  activeTab === 'solicitar'
                    ? 'border-emerald-600 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-xl shadow-emerald-300/30'
                    : 'border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-200/20'
                }`}
              >
                <div className="flex flex-col items-start gap-4">
                  <div className={`p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 ${activeTab === 'solicitar' ? 'bg-emerald-200 shadow-lg shadow-emerald-400/30' : 'bg-emerald-100 group-hover:bg-emerald-200'}`}>
                    <FileText className={`w-8 h-8 transition-colors duration-300 ${activeTab === 'solicitar' ? 'text-emerald-800' : 'text-emerald-700 group-hover:text-emerald-800'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-bold text-xl transition-colors duration-300 ${activeTab === 'solicitar' ? 'text-emerald-900' : 'text-slate-900 group-hover:text-emerald-900'}`}>
                      Solicitar CFDI
                    </h3>
                    <p className={`text-sm mt-2 transition-colors duration-300 ${activeTab === 'solicitar' ? 'text-emerald-700' : 'text-slate-600 group-hover:text-emerald-700'}`}>
                      Factura fiscal timbrada
                    </p>
                  </div>
                </div>
                <ChevronRight className={`absolute top-1/2 -translate-y-1/2 right-6 w-7 h-7 transition-all duration-500 ${activeTab === 'solicitar' ? 'text-emerald-700 opacity-100 translate-x-0' : 'text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-emerald-600'}`} />
              </button>
            </div>
          </div>

        {/* PESTAÑA: DESCARGAR TICKET */}
        {activeTab === 'buscar' && (
          <>
            {/* Hero Section */}
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-4">
                Descarga tu Comprobante
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Ingresa tu número de ticket para obtener tu comprobante de compra en formato PDF de forma instantánea
              </p>
            </div>

            {/* Search Card */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
                  <form onSubmit={handleSearch}>
                    <label htmlFor="folio" className="block text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                      Número de Ticket
                    </label>
                    <div className="flex gap-3">
                      <input
                        id="folio"
                        type="text"
                        value={folio}
                        onChange={(e) => setFolio(e.target.value)}
                        placeholder="Ej: VENTA-2024-001234"
                        className="flex-1 px-5 py-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300"
                        disabled={loading}
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 whitespace-nowrap"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Buscando...
                          </>
                        ) : (
                          <>
                            <Search className="w-5 h-5" />
                            Buscar
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                    <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900">El número de ticket se encuentra en tu comprobante de compra</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            {error && <ErrorMessage message={error} onClose={() => setError('')} />}
            {invoice && <InvoiceViewer invoice={invoice} />}

            {/* Features Section */}
            {!invoice && !error && (
              <div className="max-w-5xl mx-auto">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 p-8 rounded-2xl hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 border border-emerald-200">
                      <Zap className="w-6 h-6 text-emerald-700" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Descarga Instantánea</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Obtén tu comprobante en PDF al instante sin esperas.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 p-8 rounded-2xl hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 border border-blue-200">
                      <Shield className="w-6 h-6 text-blue-700" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Válido y Completo</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Documento oficial con todos los detalles de tu compra.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 p-8 rounded-2xl hover:shadow-lg transition-all duration-300">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 border border-purple-200">
                      <Clock className="w-6 h-6 text-purple-700" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Sin Trámites</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      No necesitas registro. Solo tu número de ticket.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* PESTAÑA: SOLICITAR CFDI */}
        {activeTab === 'solicitar' && (
          <>
            {/* Hero Section */}
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-4">
                Solicita tu CFDI Fiscal
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Factura electrónica timbrada ante el SAT. Completa el formulario y recibirás tu documento en las próximas 24 horas
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              {/* Form Card */}
              <div className="relative mb-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
                  {success ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 border border-emerald-200 mb-6 animate-bounce">
                        <CheckCircle className="w-10 h-10 text-emerald-700" />
                      </div>
                      <h3 className="text-3xl font-bold text-slate-900 mb-3">¡Solicitud Enviada!</h3>
                      <p className="text-slate-600 mb-8 leading-relaxed">{success}</p>
                      <button
                        onClick={() => setSuccess('')}
                        className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-300 font-semibold"
                      >
                        Enviar otra solicitud
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitRequest} className="space-y-6">
                      {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 animate-in">
                          <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                          <p className="text-red-900">{error}</p>
                        </div>
                      )}

                      {/* Field: Folio */}
                      <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                          Número de Folio / Ticket <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.folio}
                          onChange={(e) => setFormData({ ...formData, folio: e.target.value })}
                          placeholder="Ej: VENTA-2024-001234"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300 group-hover:border-slate-400"
                        />
                        <p className="text-xs text-slate-600 mt-2">El número se encuentra en tu comprobante de compra</p>
                      </div>

                      {/* Field: RFC */}
                      <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                          RFC <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.rfc}
                          onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                          placeholder="Ej: ABC010101ABC"
                          maxLength={13}
                          className={`w-full px-5 py-4 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 font-mono tracking-wider group-hover:border-slate-400 ${
                            formData.rfc && !isValidRfc(formData.rfc)
                              ? 'border-red-500 focus:border-red-600 focus:ring-red-500/30'
                              : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/30'
                          }`}
                        />
                        <p className="text-xs text-slate-600 mt-2">13 caracteres (mayúsculas automáticas)</p>
                        {formData.rfc && !isValidRfc(formData.rfc) && (
                          <p className="text-xs text-red-700 mt-1">RFC inválido. Formato: ABC010101ABC</p>
                        )}
                      </div>

                      {/* Field: Razón Social */}
                      <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                          Razón Social <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.razonSocial}
                          onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                          placeholder="Ej: Empresa S.A. de C.V."
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300 group-hover:border-slate-400"
                        />
                      </div>

                      {/* Two column layout for Régimen and Uso */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Field: Régimen Fiscal */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                            Régimen Fiscal <span className="text-red-600">*</span>
                          </label>
                          <select
                            required
                            value={formData.regimenFiscal}
                            onChange={(e) => setFormData({ ...formData, regimenFiscal: e.target.value })}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300 group-hover:border-slate-400 appearance-none cursor-pointer"
                          >
                            <option value="">Selecciona un régimen</option>
                            {REGIMENES_FISCALES.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Field: Uso CFDI */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                            Uso CFDI <span className="text-red-600">*</span>
                          </label>
                          <select
                            required
                            value={formData.usoCfdi}
                            onChange={(e) => setFormData({ ...formData, usoCfdi: e.target.value })}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300 group-hover:border-slate-400 appearance-none cursor-pointer"
                          >
                            {USOS_CFDI.map(u => (
                              <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Field: Email */}
                      <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                          Correo Electrónico <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="tu@email.com"
                          className={`w-full px-5 py-4 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 group-hover:border-slate-400 ${
                            formData.email && !isValidEmail(formData.email)
                              ? 'border-red-500 focus:border-red-600 focus:ring-red-500/30'
                              : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/30'
                          }`}
                        />
                        <p className="text-xs text-slate-600 mt-2">Recibirás tu CFDI en este correo</p>
                        {formData.email && !isValidEmail(formData.email) && (
                          <p className="text-xs text-red-700 mt-1">Correo electrónico inválido</p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading || (!!(formData.rfc && !isValidRfc(formData.rfc))) || (!!(formData.email && !isValidEmail(formData.email)))}
                        className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-lg flex items-center justify-center gap-3 uppercase tracking-wide"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Enviando solicitud...
                          </>
                        ) : (
                          <>
                            <Send className="w-6 h-6" />
                            Envía tu Solicitud
                          </>
                        )}
                      </button>

                      {/* Info Box */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                        <Clock className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-900 leading-relaxed">
                          Tu solicitud será procesada por nuestro equipo. Recibirás tu factura electrónica timbrada en las próximas <strong>24 horas</strong>.
                        </p>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Info Cards */}
              {!success && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                        <FileText className="w-6 h-6 text-emerald-700" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1">CFDI Fiscal</h3>
                        <p className="text-sm text-slate-600">Factura electrónica válida ante el SAT con firma digital y timbrado oficial.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 p-6 rounded-xl hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg border border-blue-200">
                        <Mail className="w-6 h-6 text-blue-700" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1">Entrega por Email</h3>
                        <p className="text-sm text-slate-600">Recibe tu comprobante directamente en tu correo electrónico de forma segura.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-slate-900 mb-3">AGRONARE</h4>
              <p className="text-slate-600 text-sm">Soluciones integrales para la gestión agroindustrial moderna.</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-3">Contacto</h4>
              <p className="text-slate-600 text-sm">📧 soporte@agronare.com<br/>📞 +52 (123) 456-7890</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-3">Legal</h4>
              <p className="text-slate-600 text-sm">Términos y Condiciones<br/>Política de Privacidad</p>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
            <p>&copy; 2026 AGRONARE S.A. DE C.V. Todos los derechos reservados.</p>
            <p className="mt-2">RFC: AGR230616K40 | Certificado SAT</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
