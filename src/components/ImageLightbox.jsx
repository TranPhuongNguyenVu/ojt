import React from "react";
import { X } from "lucide-react";

const ImageLightbox = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        aria-label="Đóng"
      >
        <X size={28} />
      </button>
      <img
        src={src}
        alt="preview"
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ImageLightbox;
