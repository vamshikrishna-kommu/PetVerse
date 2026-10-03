import { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageFile,
  onCropComplete,
  aspectRatio = 1,
}: ImageCropperModalProps) {
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();

  // Read file as data url
  if (imageFile && !imgSrc) {
    const reader = new FileReader();
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(imageFile);
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspectRatio, width, height),
      width,
      height
    );
    setCrop(crop);
  }

  const handleComplete = () => {
    if (!imgRef.current || !crop) return;
    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(
        imgRef.current,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );
      
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
          onClose();
        }
      }, 'image/webp', 0.9);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-surface p-6 shadow-2xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">Crop Avatar</h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[50vh] overflow-hidden rounded-lg bg-black/5 flex items-center justify-center">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                aspect={aspectRatio}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-h-[50vh] w-auto"
                />
              </ReactCrop>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 hover:opacity-90 transition-all"
            >
              <Check className="h-4 w-4" /> Save Crop
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
