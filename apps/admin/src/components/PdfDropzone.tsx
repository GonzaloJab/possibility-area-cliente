import { useDropzone } from 'react-dropzone';

interface Props {
  onDrop: (files: File[]) => void;
  accept?: Record<string, string[]>;
  hint?: string;
  disabled?: boolean;
}

export function PdfDropzone({
  onDrop,
  accept = { 'application/pdf': ['.pdf'] },
  hint = 'Arrastra aquí los PDFs de las facturas, o haz click para seleccionarlos',
  disabled,
}: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: true,
    disabled,
  });

  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />
      <div className="icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 3v5h5M21 8v13a2 2 0 01-2 2H5a2 2 0 01-2-2V3a2 2 0 012-2h9z" />
          <path d="M12 11v6M9 14h6" />
        </svg>
      </div>
      <p><strong>{hint}</strong></p>
      <p style={{ marginTop: 4 }}>Acepta múltiples archivos a la vez · solo PDF</p>
    </div>
  );
}
