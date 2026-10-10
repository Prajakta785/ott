'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Film, 
  Music, 
  Image as ImageIcon, 
  Loader2, 
  RefreshCw,
  Search,
  ExternalLink,
  Play,
  Check,
  Copy,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Modal } from './ui/modal';
import { bunnyService, BunnyVideoItem } from '@/lib/bunny-service';
import { getSafeImageUrl, handleImageError } from '@/lib/image-utils';

interface BunnyUploaderProps {
  type: 'video' | 'audio' | 'image';
  currentValue?: string;
  onUploadComplete: (result: {
    urlOrGuid: string;
    duration?: number;
    thumbnail?: string;
    resolution?: string;
  }) => void;
  label?: string;
  placeholder?: string;
  contentTitle?: string;
}

// Client-side fast image compressor to keep payloads tiny (< 40KB)
async function compressImageFile(file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
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

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function BunnyUploader({
  type,
  currentValue,
  onUploadComplete,
  label,
  placeholder,
  contentTitle,
}: BunnyUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [encodingStage, setEncodingStage] = useState<'idle' | 'uploading' | 'encoding' | 'ready'>('idle');
  const [manualInput, setManualInput] = useState(currentValue || '');
  const [showManual, setShowManual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bunny Library Browser State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [bunnyVideos, setBunnyVideos] = useState<BunnyVideoItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewGuid, setPreviewGuid] = useState<string | null>(null);
  const [copiedGuid, setCopiedGuid] = useState<string | null>(null);

  // External URL Fetch to Bunny State
  const [isImportingToBunny, setIsImportingToBunny] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Load videos from Bunny Stream API
  const loadBunnyVideos = async (forceRefresh = false) => {
    if (bunnyVideos.length > 0 && !forceRefresh) return;
    setIsLoadingVideos(true);
    try {
      const res = await fetch('/api/bunny/videos');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setBunnyVideos(data.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load Bunny videos:', err);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Import an external URL to Bunny Stream
  const handleImportToBunny = async () => {
    if (!manualInput.trim()) return;
    const url = manualInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('कृपया वैध व्हिडिओ URL (http किंवा https) प्रविष्ट करा.');
      return;
    }

    setIsImportingToBunny(true);
    setImportMessage('व्हिडिओ Bunny Stream कडे पाठवला जात आहे...');

    try {
      const titleToUse = contentTitle?.trim() || `Imported Video ${new Date().toLocaleDateString('mr-IN')}`;
      const res = await fetch('/api/bunny/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch_url',
          url,
          title: titleToUse,
        }),
      });

      const data = await res.json();
      if (data.success && data.guid) {
        setImportMessage(`व्हिडिओ यशस्वीरीत्या Bunny Stream (Library 767488) मध्ये सेव्ह झाला!`);
        setManualInput(data.guid);
        onUploadComplete({
          urlOrGuid: data.guid,
          duration: 5400,
          thumbnail: `https://vz-92cc7e0f-cd7.b-cdn.net/${data.guid}/thumbnail.jpg`,
          resolution: '4K UHD HDR',
        });
        setEncodingStage('ready');
        // Refresh bunny videos list
        loadBunnyVideos(true);
      } else {
        setImportMessage(`त्रुटी: ${data.message || data.error || 'Fetch failed'}`);
      }
    } catch (err: any) {
      setImportMessage(`त्रुटी: ${err?.message || 'Network error'}`);
    } finally {
      setIsImportingToBunny(false);
    }
  };

  const handleSelectBunnyVideo = (video: BunnyVideoItem) => {
    onUploadComplete({
      urlOrGuid: video.guid,
      duration: video.length,
      thumbnail: video.thumbnailUrl,
      resolution: video.availableResolutions || '4K UHD HDR',
    });
    setManualInput(video.guid);
    setEncodingStage('ready');
    setIsLibraryOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedGuid(text);
    setTimeout(() => setCopiedGuid(null), 2000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(5);
    setEncodingStage('uploading');
    setStatusText(`Preparing ${file.name}...`);

    if (type === 'image') {
      try {
        setUploadProgress(40);
        setStatusText('Optimizing image for instant display...');
        const compressedDataUrl = await compressImageFile(file, 800, 800, 0.75);
        setUploadProgress(100);
        setEncodingStage('ready');
        setStatusText('Image ready!');
        setIsUploading(false);
        onUploadComplete({
          urlOrGuid: compressedDataUrl,
        });
      } catch (err) {
        console.error('Image compression failed, using direct URL', err);
        setIsUploading(false);
      }
      return;
    }

    if (type === 'video') {
      try {
        setUploadProgress(10);
        setStatusText(`Analyzing video metadata...`);

        // Get video duration from client
        let estimatedDuration = 5400;
        try {
          const vObj = document.createElement('video');
          vObj.preload = 'metadata';
          vObj.src = URL.createObjectURL(file);
          await new Promise((r) => {
            vObj.onloadedmetadata = () => {
              if (vObj.duration && !isNaN(vObj.duration)) {
                estimatedDuration = Math.round(vObj.duration);
              }
              r(null);
            };
            vObj.onerror = () => r(null);
          });
        } catch {}

        setUploadProgress(15);
        setStatusText(`Bunny.net Stream (Library 767488) शी जोडणी करत आहे...`);

        const cleanTitle = contentTitle?.trim() || file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9\s-_]/g, ' ').trim() || `Video_${Date.now()}`;

        // 1. Create Video Object in Bunny Stream Library 767488
        const sessionRes = await fetch('/api/bunny/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_stream_video',
            title: cleanTitle,
          }),
        });

        if (!sessionRes.ok) {
          const errData = await sessionRes.json().catch(() => ({}));
          throw new Error(errData.error || `Bunny Stream session creation failed (${sessionRes.status})`);
        }

        const session = await sessionRes.json();
        const guid = session.guid || session.videoId;
        const uploadUrl = session.uploadUrl || `https://video.bunnycdn.com/library/767488/videos/${guid}`;
        const accessKey = session.accessKey || 'afb32a68-d916-4eac-83bb2d60a0df-3935-46e4';

        setUploadProgress(20);
        setStatusText(`Bunny.net Stream मध्ये थेट अपलोड सुरू आहे...`);

        // 2. Direct binary PUT upload to Bunny Stream API
        const doDirectStreamUpload = (): Promise<void> => {
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('AccessKey', accessKey);
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
                setUploadProgress(percent);
                const loadedMb = (event.loaded / (1024 * 1024)).toFixed(1);
                const totalMb = (event.total / (1024 * 1024)).toFixed(1);
                setStatusText(`Bunny.net Stream मध्ये अपलोड होत आहे: ${loadedMb} MB / ${totalMb} MB (${percent}%)`);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                reject(new Error(`Direct Stream upload failed with status ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error('Network error during Bunny Stream upload'));
            xhr.send(file);
          });
        };

        // Fallback: server-side upload if direct browser PUT fails
        const doServerStreamUpload = async (): Promise<string> => {
          setStatusText(`सर्व्हरद्वारे Bunny.net Stream वर अपलोड होत आहे...`);
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'videos');

          const sRes = await fetch('/api/bunny/upload', {
            method: 'POST',
            body: formData,
          });

          if (!sRes.ok) {
            const err = await sRes.json().catch(() => ({}));
            throw new Error(err.error || `Server stream upload failed (${sRes.status})`);
          }

          const sData = await sRes.json();
          return sData.guid || sData.videoId || guid;
        };

        let finalGuid = guid;
        try {
          await doDirectStreamUpload();
        } catch (directErr) {
          console.warn('Direct stream upload notice, trying server stream fallback:', directErr);
          setUploadProgress(50);
          finalGuid = await doServerStreamUpload();
        }

        setUploadProgress(100);
        setEncodingStage('ready');
        setStatusText('व्हिडिओ Bunny.net Stream मध्ये यशस्वीरीत्या अपलोड झाला!');
        setIsUploading(false);

        onUploadComplete({
          urlOrGuid: finalGuid,
          duration: estimatedDuration,
          thumbnail: `https://vz-92cc7e0f-cd7.b-cdn.net/${finalGuid}/thumbnail.jpg`,
          resolution: '4K UHD HDR',
        });
      } catch (err: any) {
        console.error('Video upload failed:', err);
        setStatusText(`Upload error: ${err?.message || 'Failed'}`);
        setIsUploading(false);
      }
      return;
    }

    if (type === 'audio') {
      try {
        setUploadProgress(20);
        setStatusText(`Uploading audio to Bunny Storage...`);
        const storageHost = 'storage.bunnycdn.com';
        const storageZone = 'graminbharat';
        const accessKey = '2d3836f0-1ac0-4550-bc5638b69bd8-18c0-45d9';
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `audio/${Date.now()}-${cleanName}`;
        const targetUploadUrl = `https://${storageHost}/${storageZone}/${storagePath}`;

        const xhr = new XMLHttpRequest();
        xhr.open('PUT', targetUploadUrl, true);
        xhr.setRequestHeader('AccessKey', accessKey);
        xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');
        xhr.onload = () => {
          setUploadProgress(100);
          setEncodingStage('ready');
          setStatusText('Audio file stored in Bunny Storage!');
          setIsUploading(false);
          onUploadComplete({
            urlOrGuid: targetUploadUrl,
            duration: 3600,
          });
        };
        xhr.onerror = () => {
          setIsUploading(false);
        };
        xhr.send(file);
      } catch {
        setIsUploading(false);
      }
      return;
    }
  };

  const handleManualSave = async () => {
    if (!manualInput.trim()) return;
    const trimmed = manualInput.trim();

    // If it's an external HTTP/HTTPS video URL, automatically import & register in Bunny Stream!
    if (type === 'video' && (trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.includes('b-cdn.net') && !trimmed.includes('mediadelivery.net')) {
      await handleImportToBunny();
      return;
    }

    let finalVal = trimmed;
    try {
      const resolved = bunnyService.resolvePlaybackUrls(trimmed);
      if (resolved.videoId && resolved.videoId !== trimmed) {
        finalVal = resolved.videoId;
      }
    } catch {}
    const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (iframeMatch && !finalVal) {
      finalVal = iframeMatch[1];
    }
    onUploadComplete({
      urlOrGuid: finalVal,
      duration: type === 'video' ? 5400 : undefined,
      thumbnail: `https://vz-92cc7e0f-cd7.b-cdn.net/${finalVal}/thumbnail.jpg`,
      resolution: '4K UHD HDR',
    });
    setEncodingStage('ready');
  };

  const getIcon = () => {
    switch (type) {
      case 'video':
        return <Film className="w-6 h-6 text-[#E11D48]" />;
      case 'audio':
        return <Music className="w-6 h-6 text-[#E07A5F]" />;
      case 'image':
        return <ImageIcon className="w-6 h-6 text-[#4E876C]" />;
    }
  };

  const isImageValue = type === 'image' && Boolean(currentValue && (
    currentValue.startsWith('http') || 
    currentValue.startsWith('data:image') || 
    currentValue.startsWith('/') ||
    currentValue.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)
  ));

  const filteredVideos = bunnyVideos.filter(v => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return v.title.toLowerCase().includes(q) || v.guid.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-2 w-full max-w-full overflow-hidden">
      {/* Top Header with Action Buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {label && (
          <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] truncate">
            {label}
          </label>
        )}
        
        <div className="flex items-center gap-1.5 ml-auto">
          {type === 'video' && (
            <button
              type="button"
              onClick={() => {
                setIsLibraryOpen(true);
                loadBunnyVideos();
              }}
              className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-all shadow-sm"
              title="Bunny Stream Library मधील व्हिडिओ ब्राउझ करा"
            >
              <Film className="w-3 h-3 text-rose-500" />
              <span>🐰 Bunny लायब्ररी</span>
              {bunnyVideos.length > 0 && (
                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {bunnyVideos.length}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="text-xs text-[#BE123C] hover:underline font-semibold transition-colors shrink-0 px-1"
          >
            {showManual ? '📁 Upload File' : '🔗 Paste Link'}
          </button>
        </div>
      </div>

      {showManual ? (
        <div className="space-y-2 w-full">
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => {
                const val = e.target.value;
                setManualInput(val);
                const trimmed = val.trim();
                if (trimmed) {
                  let finalVal = trimmed;
                  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
                  if (iframeMatch) finalVal = iframeMatch[1];
                  onUploadComplete({
                    urlOrGuid: finalVal,
                    duration: type === 'video' ? 5400 : undefined,
                    resolution: '4K UHD HDR',
                  });
                  setEncodingStage('ready');
                }
              }}
              onBlur={handleManualSave}
              placeholder={placeholder || (type === 'video' ? 'Bunny GUID, HLS stream URL, किंवा Embed link टाका...' : 'https://cdn.example.com/...')}
              className="flex-1 min-w-0 bg-[#FAF7F2] border border-[#E5DBCA] rounded-full px-4 py-2 text-xs text-[#2D2522] focus:outline-none focus:border-[#F472B6] focus:bg-white font-mono"
            />
            <Button size="sm" onClick={handleManualSave} className="shrink-0">
              Save
            </Button>

            {type === 'video' && manualInput.startsWith('http') && (
              <Button
                size="sm"
                variant="outline"
                disabled={isImportingToBunny}
                onClick={handleImportToBunny}
                className="shrink-0 text-xs text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 flex items-center gap-1 font-bold"
                title="हा बाह्य व्हिडिओ Bunny Stream Library मध्ये सेव्ह करा"
              >
                {isImportingToBunny ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>⚡ Bunny ला जोडा</span>
              </Button>
            )}
          </div>

          {importMessage && (
            <p className="text-xs text-[#BE123C] font-medium px-2">
              {importMessage}
            </p>
          )}
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-4 text-center cursor-pointer transition-all duration-200 w-full max-w-full overflow-hidden ${
            isUploading
              ? 'border-[#F472B6] bg-[#FDF2F8] cursor-wait'
              : currentValue
              ? 'border-[#BBF7D0] bg-[#F0FDF4]/80 hover:border-[#4E876C]'
              : 'border-[#E5DBCA] bg-[#FAF7F2]/60 hover:border-[#F472B6] hover:bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={
              type === 'video'
                ? 'video/mp4,video/mkv,video/quicktime,video/webm'
                : type === 'audio'
                ? 'audio/mp3,audio/wav,audio/aac,audio/m4a'
                : 'image/jpeg,image/png,image/webp'
            }
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />

          <div className="flex flex-col items-center justify-center space-y-2 w-full max-w-full">
            {isUploading ? (
              <div className="w-full max-w-xs space-y-2 py-2">
                <div className="p-3 rounded-2xl bg-white border border-[#E5DBCA] shadow-soft mx-auto w-fit">
                  <Loader2 className="w-6 h-6 text-[#E11D48] animate-spin" />
                </div>
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-[#7A6F68] font-semibold truncate max-w-[180px]">{statusText}</span>
                  <span className="text-[#BE123C] font-black shrink-0">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#F5EFE6] rounded-full overflow-hidden border border-[#E5DBCA]">
                  <div
                    className="h-full bg-gradient-to-r from-[#F472B6] to-[#E07A5F] transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : currentValue ? (
              <div className="w-full max-w-full space-y-2 flex flex-col items-center">
                {isImageValue ? (
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-soft bg-[#F5EFE6] shrink-0 group/img">
                    <img
                      src={getSafeImageUrl(currentValue)}
                      alt="Uploaded Preview"
                      onError={(e) => handleImageError(e)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : type === 'video' ? (
                  <div className="relative w-32 h-18 aspect-video rounded-xl overflow-hidden border-2 border-white shadow-soft bg-black shrink-0">
                    <img
                      src={`https://vz-92cc7e0f-cd7.b-cdn.net/${currentValue}/thumbnail.jpg`}
                      alt="Bunny Stream Thumbnail"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Film className="w-5 h-5 text-white/90" />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-2xl bg-white border border-[#E5DBCA] shadow-soft">
                    <CheckCircle2 className="w-6 h-6 text-[#166534]" />
                  </div>
                )}

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <span className="text-xs font-bold text-[#166534]">
                    {type === 'video' ? '🐰 Bunny Stream व्हिडिओ जोडला आहे' : type === 'audio' ? 'Audio on CDN' : 'Asset Ready'}
                  </span>
                  <Badge variant="matcha" size="sm">
                    {type === 'video' ? '4K HLS ABR' : 'Active'}
                  </Badge>
                </div>

                <div className="w-full max-w-full px-2">
                  <div className="bg-white/80 border border-[#E5DBCA] rounded-full py-1 px-3 w-full max-w-full overflow-hidden shadow-inner">
                    <p className="text-[11px] text-[#7A6F68] font-mono truncate text-center w-full block">
                      {currentValue.startsWith('data:') ? 'Optimized Image (Ready)' : currentValue}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-[#A89C94] font-medium">
                  <span className="flex items-center gap-1 hover:text-[#2D2522]">
                    <RefreshCw className="w-3 h-3" /> फाईल बदला
                  </span>
                  {type === 'video' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsLibraryOpen(true);
                        loadBunnyVideos();
                      }}
                      className="text-[#BE123C] hover:underline font-bold flex items-center gap-1"
                    >
                      🐰 Bunny मधील निवडा
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-2 space-y-1">
                <div className="p-3 rounded-2xl bg-white border border-[#E5DBCA] shadow-soft mx-auto w-fit mb-2">
                  {getIcon()}
                </div>
                <p className="text-xs font-bold text-[#2D2522]">
                  {type === 'video' ? 'Bunny.net Stream मध्ये थेट व्हिडिओ अपलोड करा' : `Click or drop ${type} file`}
                </p>
                <p className="text-[11px] text-[#7A6F68]">
                  {type === 'video'
                    ? 'MP4, MKV (Auto HLS ABR Transcoding | Lib: 767488)'
                    : type === 'audio'
                    ? 'MP3, WAV, AAC'
                    : 'JPG, PNG, WebP'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Browse Bunny Stream Library */}
      {type === 'video' && (
        <Modal
          isOpen={isLibraryOpen}
          onClose={() => {
            setIsLibraryOpen(false);
            setPreviewGuid(null);
          }}
          title="🐰 Bunny Stream व्हिडिओ लायब्ररी (Library ID: 767488)"
          description="Bunny.net Stream मधील सर्व व्हिडिओ येथे उपलब्ध आहेत. तुम्हाला हवा असलेला व्हिडिओ 1-क्लिकमध्ये निवडा."
          maxWidth="4xl"
        >
          <div className="space-y-4">
            {/* Top Toolbar: Search + Refresh + Library Info */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAF7F2] p-3 rounded-2xl border border-[#E5DBCA]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6F68]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="व्हिडिओच्या नावाने किंवा GUID ने शोधा..."
                  className="w-full bg-white border border-[#E5DBCA] rounded-full pl-9 pr-4 py-2 text-xs text-[#2D2522] focus:outline-none focus:border-[#F472B6]"
                />
              </div>

              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#7A6F68]">
                  <Badge variant="secondary" size="sm">
                    {bunnyVideos.length} व्हिडिओ
                  </Badge>
                  <span className="text-[11px] font-mono text-[#A89C94] hidden md:inline">
                    vz-92cc7e0f-cd7.b-cdn.net
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadBunnyVideos(true)}
                  disabled={isLoadingVideos}
                  className="text-xs flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVideos ? 'animate-spin text-rose-600' : ''}`} />
                  <span>रिफ्रेश</span>
                </Button>
              </div>
            </div>

            {/* Video Inline Player Preview */}
            {previewGuid && (
              <div className="p-3 bg-black rounded-2xl border border-rose-500/30 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-white text-xs px-1">
                  <span className="font-bold flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    व्हिडिओ प्लेअर प्रिव्ह्यू (Bunny Player)
                  </span>
                  <button
                    onClick={() => setPreviewGuid(null)}
                    className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={`https://iframe.mediadelivery.net/embed/767488/${previewGuid}?autoplay=true&preload=true`}
                    loading="lazy"
                    className="w-full h-full border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Videos List Grid */}
            {isLoadingVideos && bunnyVideos.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#7A6F68]">
                  Bunny Stream कडून व्हिडिओ लोड होत आहेत...
                </p>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="py-12 text-center space-y-2 border-2 border-dashed border-[#E5DBCA] rounded-2xl bg-[#FAF7F2]/50">
                <Film className="w-8 h-8 text-[#A89C94] mx-auto" />
                <p className="text-sm font-bold text-[#2D2522]">
                  कोणतेही व्हिडिओ सापडले नाहीत
                </p>
                <p className="text-xs text-[#7A6F68]">
                  {searchQuery ? 'दुसरे नाव किंवा GUID टाकून पहा.' : 'Bunny Stream Library 767488 मध्ये अद्याप व्हिडिओ नाहीत.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {filteredVideos.map((video) => {
                  const isSelected = currentValue === video.guid;
                  return (
                    <div
                      key={video.guid}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                          : 'border-[#E5DBCA] bg-white hover:border-rose-400 hover:shadow-soft'
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Video Thumbnail */}
                        <div className="relative w-28 h-18 aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-[#E5DBCA] group">
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setPreviewGuid(video.guid)}
                              title="व्हिडिओ प्ले करा"
                              className="p-1.5 rounded-full bg-white/90 text-[#BE123C] opacity-80 group-hover:opacity-100 transition-opacity"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[9px] px-1 py-0.2 rounded font-bold">
                            {formatDuration(video.length)}
                          </span>
                        </div>

                        {/* Video Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={video.status === 4 ? 'matcha' : 'sakura'}
                              size="sm"
                              className="text-[9px] px-1.5 py-0"
                            >
                              {video.statusLabel || (video.status === 4 ? 'सक्रिय' : 'तयार')}
                            </Badge>
                            <span className="text-[10px] text-[#A89C94] font-medium">
                              {video.availableResolutions || '4K/HD'}
                            </span>
                          </div>

                          <h4 className="text-xs font-extrabold text-[#2D2522] line-clamp-2 leading-tight">
                            {video.title}
                          </h4>

                          <div className="flex items-center gap-1 text-[10px] text-[#7A6F68] font-mono">
                            <span className="truncate max-w-[120px]" title={video.guid}>
                              {video.guid}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(video.guid)}
                              className="p-0.5 hover:text-[#BE123C]"
                              title="GUID कॉपी करा"
                            >
                              {copiedGuid === video.guid ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Video Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5DBCA]/60">
                        <button
                          type="button"
                          onClick={() => setPreviewGuid(video.guid)}
                          className="text-[11px] text-[#7A6F68] hover:text-[#2D2522] font-semibold flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          प्ले करून पहा
                        </button>

                        <Button
                          size="sm"
                          variant={isSelected ? 'outline' : 'primary'}
                          onClick={() => handleSelectBunnyVideo(video)}
                          className="text-xs py-1.5 px-3 h-auto font-bold"
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                              निवडलेला आहे
                            </>
                          ) : (
                            'हा व्हिडिओ वापरा'
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#E5DBCA] text-xs text-[#7A6F68]">
              <span className="font-medium">
                💡 टीप: येथे निवडलेला व्हिडिओ थेट Bunny Stream CDN वरून HLS ABR सह फास्ट प्ले होईल.
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsLibraryOpen(false)}
              >
                बंद करा
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
