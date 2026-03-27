/**
 * ReceiptModal Component
 * A professional, printable receipt for completed beauty services
 */

import React, { useState, useEffect, useRef } from "react";
import { useCurrency } from "../../contexts/CurrencyContext";
import api from "../../services/api";
import {
  XMarkIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const ReceiptModal = ({ appointmentId, onClose }) => {
  const { formatPrice } = useCurrency();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/appointments/${appointmentId}/receipt`);
        setReceipt(response.data.data);
      } catch (err) {
        console.error("Error fetching receipt:", err);
        setError(err.response?.data?.error || "Impossible de charger le reçu.");
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchReceipt();
    }
  }, [appointmentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    setDownloading(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.print-container');
          if (clonedElement) {
            clonedElement.style.height = 'auto';
            clonedElement.style.maxHeight = 'none';
            clonedElement.style.overflow = 'visible';
            clonedElement.style.position = 'static';
          }
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      
      // A4 format: 210mm x 297mm
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`recu-${receipt.receipt_number}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      // Fallback or error message could go here
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Génération du reçu...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4">
          <div className="text-red-500 mb-4 flex justify-center">
            <XMarkIcon className="h-12 w-12 border-2 border-red-500 rounded-full p-2" />
          </div>
          <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-2xl shadow-2xl rounded-2xl overflow-hidden animate-scale-in flex flex-col max-h-[95vh]">
        {/* Toolbar */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between no-print">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
            Reçu #{receipt.receipt_number}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className={`p-2 ${downloading ? "text-gray-400" : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"} rounded-lg transition-all`}
              title="Télécharger PDF"
            >
              {downloading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              ) : (
                <DocumentArrowDownIcon className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Imprimer"
            >
              <PrinterIcon className="h-6 w-6" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div 
          ref={printRef}
          className="flex-1 overflow-y-auto p-8 sm:p-12 print-container bg-white"
        >
          {/* Header / Brand */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-12 gap-6">
            <div>
              {receipt.logo_url ? (
                <img src={receipt.logo_url} alt="Logo" className="h-16 mb-4 object-contain" />
              ) : (
                <div className="h-16 w-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-4">
                  {receipt.salon_name?.charAt(0) || "S"}
                </div>
              )}
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                {receipt.salon_name}
              </h1>
              <div className="text-gray-500 text-sm mt-1 space-y-0.5">
                <p>{receipt.salon_address || "Adresse non renseignée"}</p>
                <p>{receipt.salon_phone}</p>
                <p>{receipt.salon_email}</p>
              </div>
            </div>
            <div className="text-right sm:text-right w-full sm:w-auto">
              <h2 className="text-4xl font-black text-gray-200 mb-2 uppercase italic">REÇU</h2>
              <div className="text-sm font-medium text-gray-900">
                <p className="text-gray-400 uppercase text-xs mb-1">Date d'émission</p>
                <p>{formatDate(receipt.created_at)}</p>
              </div>
              <div className="text-sm font-medium text-gray-900 mt-4">
                <p className="text-gray-400 uppercase text-xs mb-1">Numéro de reçu</p>
                <p className="font-mono">{receipt.receipt_number}</p>
              </div>
            </div>
          </div>

          <div className="h-1 w-full bg-gray-100 mb-12"></div>

          {/* Client & Staff Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Facturé à</h3>
              <p className="text-lg font-bold text-gray-900">{receipt.client_name}</p>
              <p className="text-sm text-gray-500 mt-1">Client SalonHub</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Prestation par</h3>
              <p className="text-lg font-bold text-gray-900">{receipt.staff_name}</p>
              <p className="text-sm text-gray-500 mt-1">Professionnel du salon</p>
            </div>
          </div>

          {/* Table */}
          <div className="mb-12">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-4 text-xs font-bold text-gray-900 uppercase tracking-widest">Description</th>
                  <th className="text-center py-4 text-xs font-bold text-gray-900 uppercase tracking-widest">Qté</th>
                  <th className="text-right py-4 text-xs font-bold text-gray-900 uppercase tracking-widest">Prix Unit.</th>
                  <th className="text-right py-4 text-xs font-bold text-gray-900 uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receipt.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-6">
                      <p className="font-bold text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-400 mt-1 italic">Prestation de beauté effectuée</p>
                    </td>
                    <td className="py-6 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-6 text-right text-gray-600">{formatPrice(item.unit_price)}</td>
                    <td className="py-6 text-right font-bold text-gray-900">{formatPrice(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-full sm:w-64 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 uppercase font-bold text-xs tracking-widest">Sous-total</span>
                <span className="text-gray-900 font-bold">{formatPrice(receipt.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 uppercase font-bold text-xs tracking-widest">TVA (0%)</span>
                <span className="text-gray-900 font-bold">{formatPrice(receipt.tax_amount)}</span>
              </div>
              <div className="h-px bg-gray-100 my-2"></div>
              <div className="flex justify-between items-center py-2">
                <span className="text-indigo-600 uppercase font-black text-sm tracking-widest">TOTAL</span>
                <span className="text-3xl font-black text-gray-900 tracking-tighter">
                  {formatPrice(receipt.total_amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="h-1 w-full bg-gray-100 mb-8"></div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-900 font-bold text-sm tracking-tighter uppercase mb-2">
              Merci de votre fidélité
            </p>
            <p className="text-gray-400 text-xs italic">
              Ce document est un reçu de prestation pour vos archives. 
              {receipt.salon_name} • Généré par SalonHub
            </p>
          </div>
        </div>

        {/* Action Button for download (mobile friendly visual) */}
        <div className="no-print p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex-1 flex items-center justify-center px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {downloading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : (
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            )}
            Télécharger le reçu (PDF)
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            Imprimer
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptModal;
