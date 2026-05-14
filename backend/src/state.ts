import { EventEmitter } from 'node:events';
import type { TopicsConfig } from './config.js';
import type { KioskState, MediaDetails, TopicMessage, WeatherData } from './types.js';

interface KodiStreamDetails {
  video: Array<{
    aspect: number;
    width: number;
    height: number;
    hdrtype?: string;
    codec?: string;
  }>;
  audio: Array<{
    channels: number;
    codec: string;
    language?: string;
  }>;
}

interface KodiPayload {
  val: string;
  kodi_details: {
    streamdetails: KodiStreamDetails;
  };
}

interface KodiTitlePayload {
  val: string;
  kodi_details: {
    title: string;
    type: string;
    art: {
      poster?: string;
      [key: string]: string | undefined;
    };
    streamdetails: KodiStreamDetails;
  };
}

interface KodiProgressPayload {
  val: string;
}

interface KodiPlaybackStatePayload {
  val: number;
  kodi_state: string;
}

interface PlexPayload {
  progress?: number;
  player?: string;
  media: {
    title: string;
    type: string;
    poster_url: string;
  };
  video: {
    codec: string;
    transcoded: boolean;
    resolution: string;
    aspect_label: string;
    hdr: boolean;
    hdr_type: string;
    bit_depth: number;
    color_primaries: string | null;
  };
  audio: {
    codec: string;
    channels: number;
    transcoded: boolean;
  };
}

const hdrLogoMap: Record<string, string | undefined> = {
  sdr: undefined,
  hdr10: 'hdr10',
  hlg: 'hlg',
  'dolby vision': 'dolbyvision',
  hdr: 'hdr',
};

const resolutionLogoMap: Record<string, string> = {
  '4K': '4k',
  '1440p': '1440p',
  '1080p': '1080p',
  '720p': '720p',
  SD: 'sd',
};

const nowIso = (): string => new Date().toISOString();

export const initialKioskState = (): KioskState => ({
  connected: false,
  error: null,
  posterUrl: null,
  progress: null,
  player: null,
  details: null,
  weather: null,
  temperature: null,
  updatedAt: nowIso(),
});

function formatAudioChannels(channels: number): string {
  if (channels === 8) return '7.1';
  if (channels === 6) return '5.1';
  if (channels === 2) return '2.0';
  return `${channels}ch`;
}

function formatAudio(channels: number, codec: string): string {
  return `${formatAudioChannels(channels)} ${codec.toUpperCase()}`;
}

function getKodiResolutionType(width: number): string {
  if (width >= 3840) return '4k';
  if (width >= 2560) return '1440p';
  if (width >= 1920) return '1080p';
  if (width >= 1280) return '720p';
  return 'sd';
}

function formatKodiResolution(width: number, height: number, hdrtype?: string): string {
  let resolution = '';
  if (width >= 3840) resolution = '4K';
  else if (width >= 2560) resolution = '1440p';
  else if (width >= 1920) resolution = '1080p';
  else if (width >= 1280) resolution = '720p';
  else resolution = `${width}x${height}`;

  if (hdrtype === 'dolbyvision') return `${resolution} DV`;
  if (hdrtype === 'hdr10') return `${resolution} HDR10`;
  if (hdrtype === 'hdr10plus') return `${resolution} HDR10+`;
  if (hdrtype === 'hlg') return `${resolution} HLG`;
  return resolution;
}

function formatAspect(aspect: number): string {
  return `${aspect.toFixed(2)}:1`;
}

function decodeUrlIfNeeded(url: string): string {
  try {
    if (/%[0-9A-Fa-f]{2}/.test(url)) {
      return decodeURIComponent(url);
    }
    return url;
  } catch {
    return url;
  }
}

function extractKodiImageUrl(kodiUrl: string | undefined): string | null {
  if (!kodiUrl || !kodiUrl.startsWith('image://')) return null;
  let url = kodiUrl.slice(8);
  if (url.endsWith('/')) url = url.slice(0, -1);
  const decoded = decodeUrlIfNeeded(url);
  // Strip trailing slash after decoding
  if (decoded.endsWith('/')) {
    return decoded.slice(0, -1);
  }
  return decoded;
}

function parseKodiDetails(payload: KodiPayload): MediaDetails {
  const video = payload.kodi_details.streamdetails.video[0];
  const audio = payload.kodi_details.streamdetails.audio[0];

  return {
    resolution: formatKodiResolution(video.width, video.height, video.hdrtype),
    resolutionType: getKodiResolutionType(video.width),
    hdrType: video.hdrtype?.toLowerCase(),
    audio: formatAudio(audio.channels, audio.codec),
    audioCodec: audio.codec.toLowerCase(),
    audioChannels: formatAudioChannels(audio.channels),
    aspect: formatAspect(video.aspect),
    videoCodec: video.codec,
  };
}

function parseKodiTitlePayload(payload: KodiTitlePayload): MediaDetails {
  const details = payload.kodi_details;
  const video = details.streamdetails.video[0];
  const audio = details.streamdetails.audio[0];

  return {
    title: details.title,
    mediaType: details.type,
    resolution: formatKodiResolution(video.width, video.height, video.hdrtype),
    resolutionType: getKodiResolutionType(video.width),
    hdrType: video.hdrtype?.toLowerCase(),
    videoCodec: video.codec,
    audio: formatAudio(audio.channels, audio.codec),
    audioCodec: audio.codec.toLowerCase(),
    audioChannels: formatAudioChannels(audio.channels),
    aspect: formatAspect(video.aspect),
  };
}

function parsePlexDetails(payload: PlexPayload): MediaDetails {
  const { media, video, audio } = payload;
  const hdrKey = video.hdr_type?.toLowerCase();
  const hdrType = hdrLogoMap[hdrKey] ?? (video.hdr ? 'hdr' : undefined);
  const resolutionType = resolutionLogoMap[video.resolution] ?? 'sd';

  let resolutionDisplay = video.resolution;
  if (hdrType) {
    const hdrLabel = video.hdr_type === 'Dolby Vision' ? 'DV' : video.hdr_type;
    resolutionDisplay = `${video.resolution} ${hdrLabel}`;
  }

  return {
    title: media.title,
    mediaType: media.type,
    resolution: resolutionDisplay,
    resolutionType,
    hdrType,
    aspect: video.aspect_label,
    videoCodec: video.codec,
    videoTranscoded: video.transcoded,
    bitDepth: video.bit_depth,
    colorPrimaries: video.color_primaries ?? undefined,
    audio: formatAudio(audio.channels, audio.codec),
    audioCodec: audio.codec.toLowerCase(),
    audioChannels: formatAudioChannels(audio.channels),
    audioTranscoded: audio.transcoded,
  };
}

function isPlexPayload(payload: unknown): payload is PlexPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'media' in payload &&
    'video' in payload &&
    'audio' in payload &&
    typeof (payload as PlexPayload).media?.title === 'string'
  );
}

function isKodiPayload(payload: unknown): payload is KodiPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'kodi_details' in payload &&
    typeof (payload as KodiPayload).kodi_details?.streamdetails === 'object'
  );
}

export class KioskStateStore extends EventEmitter {
  private state: KioskState = initialKioskState();

  snapshot(): KioskState {
    return this.state;
  }

  setConnectionStatus(connected: boolean, error: string | null = null): void {
    this.patch({ connected, error });
  }

  apply(topicMessage: TopicMessage, topics: TopicsConfig): void {
    const { topic, payload } = topicMessage;

    if (topic === topics.poster) {
      const url = decodeUrlIfNeeded(payload.trim());
      if (url) {
        this.patch({ posterUrl: url });
      }
      return;
    }

    if (topic === topics.progress) {
      const progress = Number.parseFloat(payload);
      if (!Number.isNaN(progress)) {
        this.patch({ progress: Math.min(100, Math.max(0, progress)) });
      }
      return;
    }

    if (topic === topics.temperature) {
      this.patch({ temperature: payload.trim() });
      return;
    }

    if (topic === topics.details) {
      try {
        const parsed = JSON.parse(payload);
        if (isPlexPayload(parsed)) {
          const next = this.state;
          this.patch({
            details: parsePlexDetails(parsed),
            player: 'plex',
            posterUrl: next.posterUrl || parsed.media.poster_url,
            progress: parsed.progress ?? next.progress,
          });
        } else if (isKodiPayload(parsed)) {
          this.patch({
            details: parseKodiDetails(parsed),
            player: 'kodi',
          });
        }
      } catch {
        this.patch({ error: `Failed to parse details payload on topic ${topic}` });
      }
      return;
    }

    if (topic === topics.weather) {
      try {
        const parsed = JSON.parse(payload);
        const weather: WeatherData = {
          state: parsed.state || 'unknown',
          temperature: parsed.attributes?.temperature ?? 0,
          humidity: parsed.attributes?.humidity ?? 0,
          windSpeed: parsed.attributes?.wind_speed ?? 0,
        };
        this.patch({ weather });
      } catch {
        this.patch({ error: `Failed to parse weather payload on topic ${topic}` });
      }
      return;
    }

    if (topic === topics.kodiTitle) {
      try {
        const parsed = JSON.parse(payload) as KodiTitlePayload;
        const next = this.state;
        this.patch({
          details: parseKodiTitlePayload(parsed),
          player: 'kodi',
          posterUrl: extractKodiImageUrl(parsed.kodi_details?.art?.poster) || next.posterUrl,
        });
      } catch {
        this.patch({ error: `Failed to parse kodi title payload on topic ${topic}` });
      }
      return;
    }

    if (topic === topics.kodiProgress) {
      try {
        const parsed = JSON.parse(payload) as KodiProgressPayload;
        const progress = Number.parseFloat(parsed.val);
        if (!Number.isNaN(progress)) {
          this.patch({
            progress: Math.min(100, Math.max(0, progress)),
            player: 'kodi',
          });
        }
      } catch {
        this.patch({ error: `Failed to parse kodi progress payload on topic ${topic}` });
      }
      return;
    }

    if (topic === topics.kodiPlaybackState) {
      try {
        const parsed = JSON.parse(payload) as KodiPlaybackStatePayload;
        if (parsed.kodi_state === 'started' || parsed.val === 1) {
          this.patch({ player: 'kodi' });
        }
      } catch {
        this.patch({ error: `Failed to parse kodi playback payload on topic ${topic}` });
      }
    }
  }

  private patch(partial: Partial<KioskState>): void {
    this.state = {
      ...this.state,
      ...partial,
      updatedAt: nowIso(),
    };
    this.emit('update', this.state);
  }
}
