'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  Radio, 
  RotateCcw, 
  X,
  Gauge,
  Check,
  Sparkles,
  Headphones,
  Music
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { bunnyService } from '@/lib/bunny-service';

export interface VideoPlayerProps {
  src: string;
  audioSrc?: string;
  audioTitle?: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  isLive?: boolean;
  onClose?: () => void;
  autoPlay?: boolean;
}

export function VideoPlayer({
  src,
  audioSrc,
  audioTitle,
  poster,
  title = '',
  subtitle,
  isLive = false,
  onClose,
  autoPlay = true,
}: VideoPlayerProps) {
  const { t, lang } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsInstanceRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'auto' | '4k' | '1080p' | '720p' | '480p' | '360p'>('auto');
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentBitrate, setCurrentBitrate] = useState('Bunny ABR (Adaptive)');
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [isAudioTrackEnabled, setIsAudioTrackEnabled] = useState<boolean>(true);
  const [forceNativePlayer, setForceNativePlayer] = useState(false);

  // Resolve Bunny Stream, Mediadelivery Embed, HLS or MP4 source
  const playbackInfo = bunnyService.resolvePlaybackUrls(src);
  const isUsingEmbed = playbackInfo.isEmbed && !audioSrc && !forceNativePlayer;
  const finalSource = (playbackInfo as any).proxyUrl || playbackInfo.hlsUrl || playbackInfo.directUrl || (
    isLive 
      ? 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' 
      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  );

  // Sync audio track volume & mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted || !isAudioTrackEnabled;
    }
  }, [volume, isMuted, isAudioTrackEnabled]);

  // Sync audio playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Load HLS.js or fallback dynamically
  useEffect(() => {
    let isMounted = true;
    const video = videoRef.current;

    // If using Bunny Mediadelivery Embed iframe, let iframe handle playback
    if (isUsingEmbed) {
      setIsLoadingStream(false);
      setCurrentBitrate('Bunny Stream 4K');
      return;
    }

    if (!video) return;

    setIsLoadingStream(true);
    const isHlsUrl = finalSource.includes('.m3u8');

    // Safe fallback helper
    const fallbackToSafeVideo = () => {
      if (video && isMounted) {
        const safeMp4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        if (video.src !== safeMp4) {
          video.onerror = null;
          video.src = safeMp4;
          video.load();
          if (autoPlay) {
            video.play().then(() => setIsPlaying(true)).catch(() => {
              video.muted = true;
              setIsMuted(true);
              video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            });
          }
        }
        setIsLoadingStream(false);
        setCurrentBitrate('Auto Fallback (1080p)');
      }
    };

    // Native HLS for Safari/iOS
    if (isHlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = finalSource;
      setIsLoadingStream(false);
      video.onerror = fallbackToSafeVideo;
    } else if (isHlsUrl) {
      const initHls = () => {
        const Hls = (window as any).Hls;
        if (Hls && Hls.isSupported()) {
          if (hlsInstanceRef.current) {
            hlsInstanceRef.current.destroy();
          }
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            fragLoadingMaxRetry: 1,
            manifestLoadingMaxRetry: 1,
          });
          hls.loadSource(finalSource);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isMounted) {
              setIsLoadingStream(false);
              if (autoPlay) {
                video.play().catch(() => setIsPlaying(false));
              }
            }
          });
          hls.on(Hls.Events.LEVEL_SWITCHED, (_: any, data: any) => {
            if (hls.levels && hls.levels[data.level]) {
              const level = hls.levels[data.level];
              setCurrentBitrate(`${level.height}p (${Math.round(level.bitrate / 1000)} kbps)`);
            }
          });
          let netErrorRetried = false;
          hls.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !netErrorRetried) {
                netErrorRetried = true;
                hls.startLoad();
              } else {
                try {
                  hls.destroy();
                } catch {}
                fallbackToSafeVideo();
              }
            }
          });
          hlsInstanceRef.current = hls;
        } else {
          fallbackToSafeVideo();
        }
      };

      if ((window as any).Hls) {
        initHls();
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.async = true;
        script.onload = () => {
          if (isMounted) initHls();
        };
        script.onerror = () => {
          if (isMounted) fallbackToSafeVideo();
        };
        document.head.appendChild(script);
      }
    } else {
      // Standard MP4 / WebM
      video.src = finalSource;
      setIsLoadingStream(false);
      video.onerror = fallbackToSafeVideo;
      if (autoPlay) {
        video.play().then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      }
    }

    return () => {
      isMounted = false;
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [finalSource, isUsingEmbed, autoPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      audioRef.current?.pause();
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        if (audioRef.current && isAudioTrackEnabled) {
          audioRef.current.currentTime = video.currentTime;
          audioRef.current.play().catch(() => {});
        }
      }).catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted || !isAudioTrackEnabled;
    }
  };

  const handleVolumeChange = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVol;
    setVolume(newVol);
    const muted = newVol === 0;
    setIsMuted(muted);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = muted || !isAudioTrackEnabled;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    if (audioRef.current && isAudioTrackEnabled) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleQualityChange = (q: 'auto' | '4k' | '1080p' | '720p' | '480p' | '360p') => {
    setSelectedQuality(q);
    setShowSettings(false);

    if (hlsInstanceRef.current && hlsInstanceRef.current.levels) {
      const hls = hlsInstanceRef.current;
      if (q === 'auto') {
        hls.currentLevel = -1; // Auto ABR
        setCurrentBitrate('Auto (Adaptive)');
      } else {
        const heightMap = { '4k': 2160, '1080p': 1080, '720p': 720, '480p': 480, '360p': 360 };
        const targetHeight = heightMap[q];
        const matchIdx = hls.levels.findIndex((lvl: any) => lvl.height === targetHeight);
        if (matchIdx !== -1) {
          hls.currentLevel = matchIdx;
          setCurrentBitrate(`${q.toUpperCase()} Fixed`);
        } else {
          setCurrentBitrate(`${q.toUpperCase()} Stream`);
        }
      }
    } else {
      setCurrentBitrate(q === 'auto' ? 'Auto ABR' : `${q.toUpperCase()} Rendition`);
    }
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl select-none group border border-slate-800"
    >
      {/* Video Element or Bunny Mediadelivery Embed Player */}
      {isUsingEmbed ? (
        <div className="relative w-full h-full">
          <iframe
            src={playbackInfo.embedUrl}
            loading="lazy"
            className="w-full h-full border-0 absolute inset-0 z-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
            allowFullScreen
            onLoad={() => setIsLoadingStream(false)}
          />
          <button
            type="button"
            onClick={() => setForceNativePlayer(true)}
            className="absolute top-3 right-3 z-20 px-2.5 py-1 bg-black/60 hover:bg-black/90 text-white/80 hover:text-white rounded-lg text-[10px] font-bold backdrop-blur-md transition opacity-0 group-hover:opacity-100 flex items-center gap-1 shadow-sm cursor-pointer"
            title={lang === 'mr' ? 'डायरेक्ट प्लेअर वापरा' : 'Switch to Direct Player'}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{lang === 'mr' ? 'डायरेक्ट प्लेअर' : 'Direct Player'}</span>
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            poster={currentTime > 0 || isPlaying ? undefined : poster}
            playsInline
            onClick={togglePlay}
            onCanPlay={() => setIsLoadingStream(false)}
            onPlay={() => {
              setIsPlaying(true);
              if (audioRef.current && isAudioTrackEnabled) {
                audioRef.current.currentTime = videoRef.current?.currentTime || 0;
                audioRef.current.play().catch(() => {});
              }
            }}
            onPause={() => {
              setIsPlaying(false);
              audioRef.current?.pause();
            }}
            onPlaying={() => {
              setIsLoadingStream(false);
              setIsPlaying(true);
              if (audioRef.current && isAudioTrackEnabled && audioRef.current.paused) {
                audioRef.current.play().catch(() => {});
              }
            }}
            onTimeUpdate={() => {
              if (videoRef.current) {
                const cur = videoRef.current.currentTime;
                setCurrentTime(cur);
                if (audioRef.current && isAudioTrackEnabled) {
                  if (Math.abs(audioRef.current.currentTime - cur) > 0.35) {
                    audioRef.current.currentTime = cur;
                  }
                }
              }
            }}
            onSeeking={() => {
              if (videoRef.current && audioRef.current) {
                audioRef.current.currentTime = videoRef.current.currentTime;
              }
            }}
            onSeeked={() => {
              if (videoRef.current && audioRef.current) {
                audioRef.current.currentTime = videoRef.current.currentTime;
              }
            }}
            onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
            onEnded={() => {
              setIsPlaying(false);
              audioRef.current?.pause();
            }}
            className="w-full h-full object-contain cursor-pointer"
          />
          {audioSrc && (
            <audio
              ref={audioRef}
              src={audioSrc}
              preload="auto"
              onEnded={() => {}}
            />
          )}
        </>
      )}

      {/* Loading Spinner */}
      {isLoadingStream && !isUsingEmbed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none z-10">
          <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-600 animate-spin mb-3" />
          <p className="text-white text-xs font-bold tracking-wider">{t('loadingStream')}</p>
        </div>
      )}

      {/* Top Header Overlay */}
      {(title || subtitle || isLive || onClose) && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-2.5 pointer-events-auto">
            {isLive ? (
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs flex items-center gap-1.5 shadow-glow-crimson animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                LIVE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-slate-300 text-[11px] font-bold border border-white/10">
                VOD HD
              </span>
            )}
            {title && (
              <div>
                <h4 className="text-white font-bold text-sm tracking-wide drop-shadow truncate max-w-sm">{title}</h4>
                {subtitle && <p className="text-slate-300 text-[10px] drop-shadow">{subtitle}</p>}
              </div>
            )}
            {audioSrc && (
              <span className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/40 text-[10px] font-bold shadow-xs">
                <Music className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>{audioTitle || (lang === 'mr' ? 'ऑडिओ कनेक्टेड' : lang === 'hi' ? 'ऑडियो कनेक्टेड' : 'Audio Track Active')}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {currentBitrate}
            </span>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition backdrop-blur-md cursor-pointer"
                title={t('closePlayer')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Center Big Play Button (when paused, only for HTML5 video) */}
      {!isPlaying && !isLoadingStream && !isUsingEmbed && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center transition shadow-2xl hover:scale-110 cursor-pointer z-10 backdrop-blur-sm"
        >
          <Play className="w-7 h-7 fill-white translate-x-0.5" />
        </button>
      )}

      {/* Bottom Controls Bar (only for HTML5 video) */}
      {!isUsingEmbed && (
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2 z-20">
        {/* Timeline Slider (for VOD) */}
        {!isLive && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-300">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-600 hover:h-2 transition-all"
            />
            <span className="text-[11px] font-mono text-slate-400">{formatTime(duration)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-rose-500 transition cursor-pointer p-1"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Mute/Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-rose-500 transition cursor-pointer p-1">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-rose-500 hidden group-hover/vol:block transition"
              />
            </div>

            {/* Audio Track Toggle (When external audio track is attached) */}
            {audioSrc && (
              <button
                type="button"
                onClick={() => {
                  const next = !isAudioTrackEnabled;
                  setIsAudioTrackEnabled(next);
                  if (audioRef.current) {
                    audioRef.current.muted = !next || isMuted;
                    if (next && isPlaying) {
                      audioRef.current.currentTime = videoRef.current?.currentTime || 0;
                      audioRef.current.play().catch(() => {});
                    } else {
                      audioRef.current.pause();
                    }
                  }
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                  isAudioTrackEnabled 
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-xs' 
                    : 'bg-white/10 text-slate-400 border-white/10 hover:text-white'
                }`}
                title={lang === 'mr' ? 'जोडलेला ऑडिओ ट्रॅक (चालू/बंद)' : 'Connected Audio Track (On/Off)'}
              >
                <Headphones className={`w-3.5 h-3.5 ${isAudioTrackEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">
                  {isAudioTrackEnabled 
                    ? (lang === 'mr' ? 'ऑडिओ चालू' : 'Audio On') 
                    : (lang === 'mr' ? 'ऑडिओ म्यूट' : 'Audio Off')}
                </span>
              </button>
            )}

            {/* Live Indicator text */}
            {isLive && (
              <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                {t('liveBroadcastFeed')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Speed Selector (VOD only) */}
            {!isLive && (
              <div className="relative">
                <button
                  onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowSettings(false); }}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition cursor-pointer"
                >
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-8 right-0 bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-xs text-white shadow-2xl min-w-[80px] z-30">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-bold text-[11px] hover:bg-rose-600 transition ${
                          playbackSpeed === s ? 'text-rose-400 font-black' : 'text-slate-300'
                        }`}
                      >
                        <span>{s}x</span>
                        {playbackSpeed === s && <Check className="w-3 h-3 text-rose-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Adaptive Bitrate & Quality Selector */}
            <div className="relative">
              <button
                onClick={() => { setShowSettings(!showSettings); setShowSpeedMenu(false); }}
                className="p-1 text-white hover:text-rose-500 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                title={t('abrSettings')}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline uppercase text-[10px] tracking-wider">{selectedQuality}</span>
              </button>

              {showSettings && (
                <div className="absolute bottom-8 right-0 bg-slate-900 border border-slate-700 rounded-2xl p-2.5 text-xs text-white shadow-2xl min-w-[170px] z-30 space-y-1">
                  <div className="px-2 py-1 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('abrSettings')}
                  </div>
                  {[
                    { id: 'auto', label: t('autoAdaptiveHls'), badge: lang === 'en' ? 'Recommended' : lang === 'hi' ? 'अनुशंसित' : 'शिफारस केलेले' },
                    { id: '4k', label: '4K UHD (2160p)', badge: 'Ultra' },
                    { id: '1080p', label: '1080p Full HD', badge: 'Crisp' },
                    { id: '720p', label: '720p HD', badge: 'Smooth' },
                    { id: '480p', label: '480p SD', badge: 'Low Data' },
                    { id: '360p', label: '360p Mobile', badge: 'Save Data' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleQualityChange(q.id as any)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs hover:bg-rose-600 transition cursor-pointer ${
                        selectedQuality === q.id ? 'bg-rose-600/30 text-rose-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{q.label}</span>
                        <span className="text-[9px] text-slate-400">{q.badge}</span>
                      </div>
                      {selectedQuality === q.id && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-rose-500 transition cursor-pointer p-1"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
