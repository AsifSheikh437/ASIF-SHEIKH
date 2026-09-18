import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PdfPreviewModal } from '../components/common/PdfPreviewModal';

interface PdfPreviewContextType {
  openPdfPreview: (blob: Blob, filename?: string, title?: string) => void;
}

const PdfPreviewContext = createContext<PdfPreviewContextType | undefined>(undefined);

export const usePdfPreview = () => {
  const context = useContext(PdfPreviewContext);
  if (!context) {
    throw new Error('usePdfPreview must be used within a PdfPreviewProvider');
  }
  return context;
};

export const PdfPreviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [filename, setFilename] = useState('document.pdf');
  const [title, setTitle] = useState('PDF Preview');
  const [isOpen, setIsOpen] = useState(false);

  const openPdfPreview = (newBlob: Blob, newFilename?: string, newTitle?: string) => {
    setBlob(newBlob);
    if (newFilename) setFilename(newFilename);
    if (newTitle) setTitle(newTitle);
    setIsOpen(true);
  };

  const closePdfPreview = () => {
    setIsOpen(false);
    setTimeout(() => {
      setBlob(null);
    }, 200);
  };

  useEffect(() => {
    const handlePreview = (e: any) => {
      openPdfPreview(e.detail.blob, e.detail.filename, e.detail.title);
    };
    window.addEventListener('preview-pdf', handlePreview);
    return () => window.removeEventListener('preview-pdf', handlePreview);
  }, []);

  return (
    <PdfPreviewContext.Provider value={{ openPdfPreview }}>
      {children}
      <PdfPreviewModal
        isOpen={isOpen}
        onClose={closePdfPreview}
        pdfBlob={blob}
        filename={filename}
        title={title}
      />
    </PdfPreviewContext.Provider>
  );
};
