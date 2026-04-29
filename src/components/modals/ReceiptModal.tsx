import React from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { FileText, Download } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string | null;
}

export function ReceiptModal({ isOpen, onClose, receiptUrl }: ReceiptModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comprobante de Pago">
      <div className="p-4">
        {receiptUrl && (
          receiptUrl.startsWith('data:application/pdf') ? (
            <div className="w-full h-64 flex flex-col items-center justify-center p-6 text-center bg-zinc-100 rounded-2xl">
              <FileText className="w-16 h-16 text-zinc-400 mb-4" />
              <p className="text-zinc-500 font-bold mb-4">Comprobante en formato PDF</p>
              <Button 
                variant="secondary" 
                className="rounded-xl"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = receiptUrl;
                  link.download = `comprobante.pdf`;
                  link.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          ) : (
            <div className="relative w-full rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
              <img 
                src={receiptUrl} 
                alt="Comprobante" 
                className="w-full h-auto object-contain max-h-[70vh]"
                referrerPolicy="no-referrer"
              />
            </div>
          )
        )}
      </div>
    </Modal>
  );
}