import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  track?: MediaStreamTrack;
  stream?: MediaStream;
  muted?: boolean;
  className?: string;
  username?: string;
}

export default function VideoPlayer({ track, stream, muted = false, className, username }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
    } else if (track) {
      const newStream = new MediaStream([track]);
      video.srcObject = newStream;
    }
  }, [track, stream]);

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      {username && (
        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {username}
        </div>
      )}
    </div>
  );
}
