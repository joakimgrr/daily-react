import React, { forwardRef, memo, useEffect, useRef } from 'react';

import { useMediaTrack } from '../hooks/useMediaTrack';
import useMergedRef from '../hooks/useMergedRef';

export interface DailyAudioPlayException {
  name?: string;
  message?: string;
  sessionId: string;
  target: HTMLAudioElement;
  type: string;
}

interface Props extends React.AudioHTMLAttributes<HTMLAudioElement> {
  /**
   * Callback to handle failed attempt to play audio.
   */
  onPlayFailed?(e: DailyAudioPlayException): void;
  sessionId: string;
  type?: 'audio' | 'screenAudio' | 'rmpAudio';
}

export const DailyAudioTrack = memo(
  forwardRef<HTMLAudioElement, Props>(
    ({ onPlayFailed, sessionId, type = 'audio', ...props }, ref) => {
      const audioEl = useRef<HTMLAudioElement>(null);
      const audio = useMediaTrack(sessionId, type);
      const audioRef = useMergedRef<HTMLAudioElement>(audioEl, ref);

      /**
       * Setup audio tag.
       */
      useEffect(() => {
        const audioTag = audioEl.current;
        if (!audioTag || !audio?.persistentTrack) return;
        let playTimeout: ReturnType<typeof setTimeout>;
        const handleCanPlay = () => {
          playTimeout = setTimeout(() => {
            if (
              audioTag.readyState === audioTag.HAVE_ENOUGH_DATA &&
              !audioTag.paused
            )
              return;
            onPlayFailed?.({
              sessionId,
              target: audioTag,
              type,
            });
          }, 1500);
        };
        const handlePlay = () => {
          clearTimeout(playTimeout);
        };
        audioTag.addEventListener('canplay', handleCanPlay);
        audioTag.addEventListener('play', handlePlay);
        audioTag.srcObject = new MediaStream([audio?.persistentTrack]);

        return () => {
          audioTag?.removeEventListener('canplay', handleCanPlay);
          audioTag?.removeEventListener('play', handlePlay);
        };
      }, [audio?.persistentTrack, onPlayFailed, sessionId, type]);

      return (
        <audio
          autoPlay
          playsInline
          ref={audioRef}
          {...props}
          data-session-id={sessionId}
          data-audio-type={type}
        />
      );
    }
  )
);
DailyAudioTrack.displayName = 'DailyAudioTrack';
