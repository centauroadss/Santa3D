// components/judges/VideoCard.tsx
'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';
import TechnicalReportTable from './TechnicalReportTable'; // New Import

interface VideoCardProps {
  video: {
    id: string;
    fileName: string;
    streamUrl: string;
    uploadedAt: string;
    resolution?: string; // New
    duration?: number;   // New
    fps?: number;        // New
    participant: {
      alias: string;
      instagram: string;
    };
    hasEvaluated: boolean;
  };
  onEvaluate: (videoId: string) => void;
}

export default function VideoCard({ video, onEvaluate }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card className="hover:shadow-xl transition-shadow flex flex-col h-full">
      <div className="space-y-4 flex-1">
        {/* Video Player */}
        <div className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden">
          {isPlaying ? (
            <video
              src={video.streamUrl}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              autoPlay
              className="w-full h-full object-contain"
              onEnded={() => setIsPlaying(false)}
            >
              Tu navegador no soporta el elemento de video.
            </video>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center cursor-pointer group"
              onClick={() => setIsPlaying(true)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button className="relative z-10 w-20 h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-brand-purple ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h4 className="font-bold text-lg text-gray-900 line-clamp-1" title={video.participant.alias}>{video.participant.alias}</h4>
          <p className="text-sm text-gray-500">{video.participant.instagram}</p>
          <p className="text-xs text-gray-400 mt-1">
            Subido: {formatDateTime(video.uploadedAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {video.hasEvaluated ? (
            <div className="flex-1 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center font-semibold text-sm">
              ✅ Ya Evaluado
            </div>
          ) : (
            <Button
              onClick={() => onEvaluate(video.id)}
              className="flex-1 text-sm py-2"
              variant="primary"
            >
              📝 Evaluar Video
            </Button>
          )}
        </div>
      </div>

      {/* Footer: Technical Report */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <TechnicalReportTable
          resolution={video.resolution}
          duration={video.duration}
          fps={video.fps}
          condensed={true}
        />
      </div>
    </Card>
  );
}
