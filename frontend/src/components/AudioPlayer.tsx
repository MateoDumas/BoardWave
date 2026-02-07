import { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  track: MediaStreamTrack;
}

export default function AudioPlayer({ track }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    const stream = new MediaStream([track]);
    audio.srcObject = stream;
    
    // Ensure playback starts (especially on mobile)
    audio.play().catch(err => {
      console.warn('Audio autoplay failed:', err);
    });

  }, [track]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      controls={false}
      style={{ display: 'none' }}
    />
  );
}
