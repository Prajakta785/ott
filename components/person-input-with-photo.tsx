'use client';

import React, { useRef } from 'react';
import { Camera, Trash2, X, Image as ImageIcon } from 'lucide-react';

interface PersonInputWithPhotoProps {
  label: string;
  name: string;
  photoUrl?: string;
  onNameChange: (val: string) => void;
  onPhotoChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  tooltipText?: string;
}

// Client-side image compressor for fast, compact avatar storage (< 30KB)
async function compressAvatar(file: File, maxSize = 350, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PersonInputWithPhoto({
  label,
  name,
  photoUrl,
  onNameChange,
  onPhotoChange,
  placeholder,
  required = false,
  tooltipText = 'फोटो अपलोड करा (Upload Photo)',
}: PersonInputWithPhotoProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatar(file, 350, 0.8);
      onPhotoChange(compressed);
    } catch (err) {
      console.error('Failed to compress avatar:', err);
    } finally {
      // Reset input so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block">
          {label}
        </label>
        {photoUrl && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              ✓ फोटो जोडला आहे
            </span>
            <button
              type="button"
              onClick={() => {
                onPhotoChange('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              title="फोटो काढून टाका (Remove photo)"
            >
              <Trash2 className="w-3 h-3" />
              <span>काढून टाका (Remove)</span>
            </button>
          </div>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          required={required}
          value={name || ''}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl pl-4 py-2.5 text-sm text-[#2D2522] focus:outline-none focus:border-[#EA580C] focus:bg-white transition ${photoUrl ? 'pr-20' : 'pr-12'}`}
        />

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Small photo upload icon / preview and explicit remove button inside the box */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {photoUrl ? (
            <>
              {/* Avatar Preview (Click to change) */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer flex items-center justify-center"
                title="फोटो बदला (Click to change photo)"
              >
                <img
                  src={photoUrl}
                  alt={name || label}
                  className="w-7 h-7 rounded-full object-cover border-2 border-[#EA580C] shadow-sm hover:opacity-80 transition"
                />
              </div>

              {/* Dedicated Remove Button Icon */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPhotoChange('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 flex items-center justify-center transition shadow-xs cursor-pointer group"
                title="फोटो काढून टाका (Remove photo)"
              >
                <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 rounded-xl bg-white border border-[#E5DBCA] text-[#7A6F68] hover:text-[#EA580C] hover:border-[#EA580C] hover:bg-[#FFF7ED] flex items-center justify-center transition shadow-xs cursor-pointer group"
              title={tooltipText}
            >
              <Camera className="w-4 h-4 group-hover:scale-110 transition text-[#7A6F68] group-hover:text-[#EA580C]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
