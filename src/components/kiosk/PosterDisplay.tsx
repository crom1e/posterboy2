import { useState, useEffect, useRef } from 'react';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 10_000; // 10 seconds between retries

interface PosterDisplayProps {
  posterUrl: string | null;
}

export function PosterDisplay({ posterUrl }: PosterDisplayProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [candidateUrl, setCandidateUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [failed, setFailed] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only treat a poster URL as active after it successfully preloads.
  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    setFailed(false);
    setFailedUrl(null);
    setRetryCount(0);

    if (!posterUrl) {
      setCandidateUrl(null);
      if (displayUrl) {
        setStatusMessage('No active poster URL. Showing last known poster.');
      } else {
        setStatusMessage('Waiting for a poster URL...');
      }
      return;
    }

    if (posterUrl === displayUrl) {
      setCandidateUrl(null);
      setStatusMessage(null);
      return;
    }

    setCandidateUrl(posterUrl);
    setStatusMessage('Loading new poster...');
  }, [posterUrl, displayUrl]);

  // Try to preload candidate URLs and only swap display on success.
  useEffect(() => {
    if (!candidateUrl) {
      return;
    }

    let canceled = false;
    const probe = new Image();

    probe.onload = () => {
      if (canceled) {
        return;
      }

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      setDisplayUrl(candidateUrl);
      setCandidateUrl(null);
      setRetryCount(0);
      setFailed(false);
      setFailedUrl(null);
      setStatusMessage(null);
    };

    probe.onerror = () => {
      if (canceled) {
        return;
      }

      if (retryCount < MAX_RETRIES) {
        const nextAttempt = retryCount + 1;
        setStatusMessage(`Poster load failed. Retrying (${nextAttempt}/${MAX_RETRIES})...`);
        retryTimerRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, RETRY_DELAY_MS);
        return;
      }

      setFailed(true);
      setFailedUrl(candidateUrl);
      setCandidateUrl(null);
      if (displayUrl) {
        setStatusMessage('Current poster URL failed. Showing previous poster.');
      } else {
        setStatusMessage('Poster could not be loaded.');
      }
    };

    probe.src = candidateUrl;

    return () => {
      canceled = true;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [candidateUrl, retryCount, displayUrl]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  if (!displayUrl && !candidateUrl) {
    return (
      <div className="w-full h-full bg-muted/20 flex flex-col items-center justify-center gap-2">
        <span className="text-muted-foreground text-lg">No poster available</span>
        <span className="text-muted-foreground/60 text-sm text-center px-4">{statusMessage ?? 'Waiting for a poster URL...'}</span>
        {failed && failedUrl && (
          <span className="text-muted-foreground/60 text-xs text-center px-4 break-all">Failed URL: {failedUrl}</span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden relative">
      {displayUrl && (
        <img
          src={displayUrl}
          alt=""
          className="w-full h-full object-cover object-top"
        />
      )}
      {(candidateUrl || statusMessage) && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 px-2">
          {statusMessage}
        </div>
      )}
      {failed && failedUrl && (
        <div className="absolute top-2 left-2 right-2 bg-black/55 text-white text-[11px] text-center py-1 px-2 break-all">
          Failed URL: {failedUrl}
        </div>
      )}
    </div>
  );
}
