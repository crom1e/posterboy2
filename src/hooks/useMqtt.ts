import { useEffect, useState, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { MQTT_CONFIG } from '@/config/mqtt.config';

export interface MediaDetails {
  // Media info
  title?: string;
  mediaType?: string;
  
  // Video
  resolution: string;
  resolutionType?: string;
  hdrType?: string;
  aspect: string;
  videoCodec?: string;
  videoTranscoded?: boolean;
  bitDepth?: number;
  colorPrimaries?: string;
  
  // Audio
  audio: string;
  audioCodec?: string;
  audioChannels?: string;
  audioTranscoded?: boolean;
}

export interface WeatherData {
  state: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

interface MqttState {
  connected: boolean;
  error: string | null;
  posterUrl: string | null;
  progress: number | null;
  player: 'plex' | 'kodi' | null;
  details: MediaDetails | null;
  weather: WeatherData | null;
  temperature: string | null;
}

// Kodi payload types
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

// Plex payload types
interface PlexPayload {
  progress?: number;
  player?: string;
  media: {
    title: string;
    type: string;
    poster_url: string;
    backdrop_url: string;
  };
  video: {
    codec: string;
    transcoded: boolean;
    width: number;
    height: number;
    resolution: string;
    aspect_ratio: number;
    aspect_label: string;
    hdr: boolean;
    hdr_type: string;
    bit_depth: number;
    color_primaries: string | null;
  };
  audio: {
    codec: string;
    channels: number;
    layout: string;
    transcoded: boolean;
  };
}

// Decode URL if it's URL-encoded
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

// Kodi resolution mapping
function getKodiResolutionType(width: number): string {
  if (width >= 3840) return '4k';
  if (width >= 2560) return '1440p';
  if (width >= 1920) return '1080p';
  if (width >= 1280) return '720p';
  return 'sd';
}

function formatKodiResolution(width: number, height: number, hdrtype?: string): string {
  let res = '';
  if (width >= 3840) res = '4K';
  else if (width >= 2560) res = '1440p';
  else if (width >= 1920) res = '1080p';
  else if (width >= 1280) res = '720p';
  else res = `${width}x${height}`;
  
  if (hdrtype === 'dolbyvision') return `${res} DV`;
  if (hdrtype === 'hdr10') return `${res} HDR10`;
  if (hdrtype === 'hdr10plus') return `${res} HDR10+`;
  if (hdrtype === 'hlg') return `${res} HLG`;
  
  return res;
}

function formatAudioChannels(channels: number): string {
  if (channels === 8) return '7.1';
  if (channels === 6) return '5.1';
  if (channels === 2) return '2.0';
  return `${channels}ch`;
}

function formatAudio(channels: number, codec: string): string {
  const channelStr = formatAudioChannels(channels);
  const codecStr = codec.toUpperCase();
  return `${channelStr} ${codecStr}`;
}

function formatAspect(aspect: number): string {
  return `${aspect.toFixed(2)}:1`;
}

// HDR type mapping for Plex (backend values → logo keys)
const hdrLogoMap: Record<string, string | undefined> = {
  'sdr': undefined,
  'hdr10': 'hdr10',
  'hlg': 'hlg',
  'dolby vision': 'dolbyvision',
  'hdr': 'hdr',
};

// Resolution mapping for Plex (backend values → logo keys)
const resolutionLogoMap: Record<string, string> = {
  '4K': '4k',
  '1440p': '1440p',
  '1080p': '1080p',
  '720p': '720p',
  'SD': 'sd',
};

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

function parsePlexDetails(payload: PlexPayload): MediaDetails {
  const { media, video, audio } = payload;
  
  // Map HDR type to logo key
  const hdrKey = video.hdr_type?.toLowerCase();
  const hdrType = hdrLogoMap[hdrKey] ?? (video.hdr ? 'hdr' : undefined);
  
  // Map resolution to logo key
  const resolutionType = resolutionLogoMap[video.resolution] ?? 'sd';
  
  // Build display resolution string
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

function isKodiPayload(payload: unknown): payload is KodiPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'kodi_details' in payload &&
    typeof (payload as KodiPayload).kodi_details?.streamdetails === 'object'
  );
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

export function useMqtt() {
  const [state, setState] = useState<MqttState>({
    connected: false,
    error: null,
    posterUrl: null,
    progress: null,
    player: null,
    details: null,
    weather: null,
    temperature: null,
  });

  const clientRef = useRef<MqttClient | null>(null);

  const connect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end();
    }

    const options: mqtt.IClientOptions = {
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    };

    if (MQTT_CONFIG.username) {
      options.username = MQTT_CONFIG.username;
      options.password = MQTT_CONFIG.password;
    }

    try {
      const client = mqtt.connect(MQTT_CONFIG.brokerUrl, options);
      clientRef.current = client;

      client.on('connect', () => {
        console.log('MQTT connected');
        setState(prev => ({ ...prev, connected: true, error: null }));
        
        const topics = Object.values(MQTT_CONFIG.topics);
        topics.forEach(topic => {
          client.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
              console.error(`Subscribe error for ${topic}:`, err);
            } else {
              console.log(`Subscribed to ${topic}`);
            }
          });
        });
      });

      client.on('message', (topic, message) => {
        const payload = message.toString().trim();
        console.log(`Received on ${topic}:`, payload);

        const { topics } = MQTT_CONFIG;

        if (topic === topics.poster) {
          const url = decodeUrlIfNeeded(payload);
          if (url) {
            setState(prev => ({ ...prev, posterUrl: url }));
          }
        } else if (topic === topics.progress) {
          const progress = parseFloat(payload);
          if (!isNaN(progress)) {
            setState(prev => ({ ...prev, progress: Math.min(100, Math.max(0, progress)) }));
          }
        } else if (topic === topics.details) {
          try {
            const parsed = JSON.parse(payload);
            
            if (isPlexPayload(parsed)) {
              const details = parsePlexDetails(parsed);
              setState(prev => ({
                ...prev,
                details,
                player: 'plex',
                // Use Plex poster as fallback if separate topic hasn't provided one
                posterUrl: prev.posterUrl || parsed.media.poster_url,
                // Update progress if included in Plex payload
                progress: parsed.progress !== undefined ? parsed.progress : prev.progress,
              }));
            } else if (isKodiPayload(parsed)) {
              const details = parseKodiDetails(parsed);
              setState(prev => ({ ...prev, details, player: 'kodi' }));
            } else {
              setState(prev => ({ ...prev, details: parsed as MediaDetails }));
            }
          } catch (e) {
            console.error('Failed to parse details JSON:', e);
          }
        } else if (topic === topics.weather) {
          try {
            const parsed = JSON.parse(payload);
            const weather: WeatherData = {
              state: parsed.state || 'unknown',
              temperature: parsed.attributes?.temperature ?? 0,
              humidity: parsed.attributes?.humidity ?? 0,
              windSpeed: parsed.attributes?.wind_speed ?? 0,
            };
            setState(prev => ({ ...prev, weather }));
          } catch (e) {
            console.error('Failed to parse weather JSON:', e);
          }
        } else if (topic === topics.temperature) {
          setState(prev => ({ ...prev, temperature: payload }));
        }
      });

      client.on('error', (err) => {
        console.error('MQTT error:', err);
        setState(prev => ({ ...prev, error: err.message }));
      });

      client.on('close', () => {
        console.log('MQTT disconnected');
        setState(prev => ({ ...prev, connected: false }));
      });

      client.on('reconnect', () => {
        console.log('MQTT reconnecting...');
      });

    } catch (err) {
      const error = err instanceof Error ? err.message : 'Connection failed';
      setState(prev => ({ ...prev, error }));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, [connect]);

  return state;
}
