'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw,
  X,
  ExternalLink,
  Headphones,
  Music,
  AlertCircle
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';

export interface AudioPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  host?: string;
  category?: string;
  onClose?: () => void;
  autoPlay?: boolean;
}

export function AudioPlayer({
  src,
  poster,
  title = 'Podcast Episode',
  host = 'Host / Presenter',
  category,
  onClose,
  autoPlay = true,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auto play on mount
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setHasError(false);
    setIsLoading(true);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
      if (autoPlay) {
        audio.play().catch(() => setIsPlaying(false));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [src, autoPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) {
        audioRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const skipSeconds = (seconds: number) => {
    if (!audioRef.current) return;
    const next = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatAudioTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      const remMins = mins % 60;
      return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#2D2522] to-[#1A1412] text-white rounded-3xl border border-[#4A3E39] shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Headphones className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              {category || 'Gramin Bharat Podcast'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                title="Open stream URL in new tab"
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Close Player"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Artwork & Info Banner */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-800 border border-zinc-700/80 overflow-hidden shrink-0 shadow-lg flex items-center justify-center group">
            {poster ? (
              <img src={poster} alt={title} className="w-full h-full object-cover" />
            ) : (
              <Music className="w-8 h-8 text-purple-400" />
            )}
            <div className={`absolute inset-0 bg-purple-900/30 backdrop-blur-[1px] flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-end gap-1 h-5">
                <span className={`w-1 bg-purple-400 rounded-full ${isPlaying ? 'animate-pulse' : ''} h-3`} />
                <span className={`w-1 bg-purple-300 rounded-full ${isPlaying ? 'animate-pulse' : ''} h-5`} />
                <span className={`w-1 bg-purple-400 rounded-full ${isPlaying ? 'animate-pulse' : ''} h-2`} />
                <span className={`w-1 bg-purple-200 rounded-full ${isPlaying ? 'animate-pulse' : ''} h-4`} />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg sm:text-xl text-white truncate leading-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 truncate">
              {host ? `Host: ${host}` : 'Gramin Bharat Voice Network'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                Bunny CDN Stream
              </span>
              {duration > 0 && (
                <span className="text-[11px] font-mono text-zinc-400">
                  {formatDuration(duration)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Warning if URL invalid */}
        {hasError && (
          <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Unable to stream audio</p>
              <p className="text-[11px] text-rose-300/80">Please check the Audio / Bunny.net URL. Verify CDN access or file permissions.</p>
            </div>
          </div>
        )}

        {/* Seek Bar & Timers */}
        <div className="space-y-1.5">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={hasError || duration === 0}
            className="w-full h-1.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition"
          />
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls Bar */}
        <div className="flex items-center justify-between gap-4 pt-1">
          {/* Speed Selector */}
          <button
            onClick={cycleSpeed}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono font-bold text-zinc-300 transition cursor-pointer border border-white/10"
            title="Cycle Playback Speed"
          >
            {playbackSpeed}x
          </button>

          {/* Center Playback Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => skipSeconds(-10)}
              className="p-2.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              disabled={hasError}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-600 to-rose-500 hover:from-purple-500 hover:to-rose-400 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white translate-x-0.5" />
              )}
            </button>

            <button
              onClick={() => skipSeconds(10)}
              className="p-2.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-white transition cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
