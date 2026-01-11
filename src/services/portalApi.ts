import type { Venta, CFDIStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type TicketFiscalData = {
  rfc: string;
  razonSocial: string;
} | null;

export const portalApi = {
  /**
   * Buscar factura por número de folio
   */
  async getInvoiceByFolio(folio: string): Promise<ApiResponse<Venta>> {
    try {
      const response = await fetch(`${API_BASE}/ventas/public/ticket/${folio}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return {
        success: false,
        error: 'Error al buscar factura. Intente nuevamente.'
      };
    }
  },

  /**
   * Obtener RFC y razón social (solo si el ticket está ligado a un cliente registrado)
   */
  async getTicketFiscalData(folio: string): Promise<ApiResponse<TicketFiscalData>> {
    try {
      const response = await fetch(`${API_BASE}/ventas/public/ticket/${folio}/fiscal`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching ticket fiscal data:', error);
      return {
        success: false,
        error: 'Error al buscar datos fiscales. Intente nuevamente.'
      };
    }
  },

  /**
   * Descargar PDF del ticket
   */
  async downloadTicketPDF(folio: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/ventas/public/ticket/${folio}/pdf`);

      if (!response.ok) {
        throw new Error('Error al descargar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ticket_${folio}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading ticket PDF:', error);
      throw error;
    }
  },

  /**
   * Solicitar CFDI timbrado
   */
  async requestCFDI(data: {
    folio: string;
    clienteEmail: string;
    clienteTelefono?: string;
    notaCliente?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/ventas/public/cfdi/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error requesting CFDI:', error);
      return {
        success: false,
        error: 'Error al solicitar CFDI. Intente nuevamente.'
      };
    }
  },

  /**
   * Consultar estado del CFDI
   */
  async getCFDIStatus(folio: string): Promise<ApiResponse<CFDIStatus>> {
    try {
      const response = await fetch(`${API_BASE}/ventas/public/cfdi/status/${folio}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching CFDI status:', error);
      return {
        success: false,
        error: 'Error al consultar estado del CFDI.'
      };
    }
  },

  /**
   * Descargar CFDI PDF
   */
  async downloadCFDIPDF(folio: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/ventas/public/cfdi/download/${folio}/pdf`);

      if (!response.ok) {
        throw new Error('CFDI PDF no disponible');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CFDI_${folio}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CFDI PDF:', error);
      throw error;
    }
  },

  /**
   * Descargar CFDI XML
   */
  async downloadCFDIXML(folio: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/ventas/public/cfdi/download/${folio}/xml`);

      if (!response.ok) {
        throw new Error('CFDI XML no disponible');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CFDI_${folio}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CFDI XML:', error);
      throw error;
    }
  },

  /**
   * Solicitud fiscal (Portal)
   * Nuevo flujo: folio + RFC + razón social + uso CFDI + régimen fiscal + email
   */
  async submitFacturacionRequest(data: {
    folio: string;
    rfc: string;
    razonSocial: string;
    usoCfdi: string;
    regimenFiscal: string;
    email: string;
  }): Promise<ApiResponse<{ message: string; solicitudId?: number }>> {
    try {
      const response = await fetch(`${API_BASE}/ventas/public/cfdi/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error submitting facturacion request:', error);
      return {
        success: false,
        error: 'Error al enviar la solicitud. Intente nuevamente.'
      };
    }
  },
};
