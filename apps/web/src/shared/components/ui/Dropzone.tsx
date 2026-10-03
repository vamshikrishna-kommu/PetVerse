import { useCallback } from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface DropzoneProps extends DropzoneOptions {
  className?: string;
  onFileAccepted: (file: File) => void;
}

export function Dropzone({ className, onFileAccepted, ...options }: DropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/*': [] },
    ...options
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all',
        isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-surface-2',
        className
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className={cn('mx-auto h-12 w-12', isDragActive ? 'text-primary' : 'text-muted')} />
      <p className="mt-4 text-sm font-medium text-foreground">
        {isDragActive ? 'Drop image here...' : 'Drag & drop an image, or click to select'}
      </p>
      <p className="mt-2 text-xs text-muted">Supports JPG, PNG, WEBP (Max 5MB)</p>
    </div>
  );
}
