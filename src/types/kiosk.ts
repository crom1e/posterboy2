export interface MediaDetails {
  title?: string;
  mediaType?: string;
  resolution: string;
  resolutionType?: string;
  hdrType?: string;
  aspect: string;
  videoCodec?: string;
  videoTranscoded?: boolean;
  bitDepth?: number;
  colorPrimaries?: string;
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

export interface KioskState {
  connected: boolean;
  error: string | null;
  posterUrl: string | null;
  progress: number | null;
  player: 'plex' | 'kodi' | null;
  details: MediaDetails | null;
  weather: WeatherData | null;
  temperature: string | null;
  updatedAt: string;
}

export const initialKioskState: KioskState = {
  connected: false,
  error: null,
  posterUrl: null,
  progress: null,
  player: null,
  details: null,
  weather: null,
  temperature: null,
  updatedAt: new Date(0).toISOString(),
};
