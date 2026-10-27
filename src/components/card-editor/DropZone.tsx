import { useRef, type CSSProperties, type ReactNode } from 'react';

interface DropZoneProps {
  accept: string;
  onFile: (file: File) => void;
  preview: ReactNode;
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function DropZone({ accept, onFile, preview, label, className = '', style }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const open = () => inputRef.current?.click();
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          open();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        onDragOver={(e) => e.preventDefault()}
        className={`border-gold-dashed rounded flex items-center justify-center text-center cursor-pointer transition-colors overflow-hidden ${className}`}
        style={style}
      >
        {preview ?? <span className="text-gold-500 text-sm px-2">Drop image or click to upload</span>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
        className="hidden"
      />
    </>
  );
}
