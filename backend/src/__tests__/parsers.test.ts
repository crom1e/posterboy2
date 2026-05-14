import { describe, it, expect, beforeEach } from '@jest/globals';
import { KioskStateStore, initialKioskState } from '../state.js';
import { config } from '../config.js';

describe('Parser Parity Tests', () => {
  let store: KioskStateStore;

  beforeEach(() => {
    store = new KioskStateStore();
  });

  describe('Plex payload parsing', () => {
    it('parses Plex details with HDR and transcoding', () => {
      const payload = JSON.stringify({
        progress: 45.5,
        player: 'plex',
        media: {
          title: 'The Matrix',
          type: 'movie',
          poster_url: 'https://example.com/poster.jpg',
        },
        video: {
          codec: 'hevc',
          transcoded: false,
          resolution: '1080p',
          aspect_label: '2.39:1',
          hdr: true,
          hdr_type: 'Dolby Vision',
          bit_depth: 10,
          color_primaries: 'bt2020',
        },
        audio: {
          codec: 'truehd',
          channels: 8,
          transcoded: false,
        },
      });

      store.apply({ topic: config.topics.details, payload }, config.topics);
      const state = store.snapshot();

      expect(state.details).toBeDefined();
      expect(state.details?.title).toBe('The Matrix');
      expect(state.details?.resolution).toContain('1080p');
      expect(state.details?.resolution).toContain('DV');
      expect(state.details?.audio).toContain('7.1');
      expect(state.details?.audio).toContain('TRUEHD');
      expect(state.details?.hdrType).toBe('dolbyvision');
      expect(state.player).toBe('plex');
      expect(state.progress).toBe(45.5);
      expect(state.posterUrl).toBe('https://example.com/poster.jpg');
    });

    it('parses Plex details without HDR', () => {
      const payload = JSON.stringify({
        media: {
          title: 'Inception',
          type: 'movie',
          poster_url: 'https://example.com/inception.jpg',
        },
        video: {
          codec: 'h264',
          transcoded: true,
          resolution: '720p',
          aspect_label: '2.35:1',
          hdr: false,
          hdr_type: 'sdr',
          bit_depth: 8,
          color_primaries: null,
        },
        audio: {
          codec: 'aac',
          channels: 2,
          transcoded: true,
        },
      });

      store.apply({ topic: config.topics.details, payload }, config.topics);
      const state = store.snapshot();

      expect(state.details?.resolution).toBe('720p');
      expect(state.details?.audio).toBe('2.0 AAC');
      expect(state.details?.hdrType).toBeUndefined();
      expect(state.details?.videoTranscoded).toBe(true);
      expect(state.details?.audioTranscoded).toBe(true);
    });

    it('preserves previous poster if Plex payload includes one', () => {
      store.apply({ topic: config.topics.poster, payload: 'https://old.com/poster.jpg' }, config.topics);

      const plexPayload = JSON.stringify({
        media: {
          title: 'Test',
          type: 'movie',
          poster_url: 'https://plex.com/new-poster.jpg',
        },
        video: {
          codec: 'hevc',
          transcoded: false,
          resolution: '1080p',
          aspect_label: '1.78:1',
          hdr: false,
          hdr_type: 'sdr',
          bit_depth: 8,
          color_primaries: null,
        },
        audio: { codec: 'aac', channels: 2, transcoded: false },
      });

      store.apply({ topic: config.topics.details, payload: plexPayload }, config.topics);
      const state = store.snapshot();

      // First posterUrl from separate topic should be preserved, fallback to Plex if missing
      expect(state.posterUrl).toBe('https://old.com/poster.jpg');
    });
  });

  describe('Kodi payload parsing', () => {
    it('parses Kodi title with poster and stream details', () => {
      const payload = JSON.stringify({
        val: 'The Avengers',
        kodi_details: {
          title: 'The Avengers',
          type: 'movie',
          art: {
            poster: 'image://https%3a%2f%2fexample.com%2fmovies%2favengers.jpg/',
          },
          streamdetails: {
            video: [
              {
                width: 3840,
                height: 2160,
                aspect: 1.78,
                codec: 'hevc',
                hdrtype: 'hdr10',
              },
            ],
            audio: [
              {
                channels: 8,
                codec: 'truehd',
                language: 'eng',
              },
            ],
          },
        },
      });

      store.apply({ topic: config.topics.kodiTitle, payload }, config.topics);
      const state = store.snapshot();

      expect(state.details).toBeDefined();
      expect(state.details?.title).toBe('The Avengers');
      expect(state.details?.resolution).toContain('4K');
      expect(state.details?.resolution).toContain('HDR10');
      expect(state.details?.audio).toContain('7.1');
      expect(state.details?.resolutionType).toBe('4k');
      expect(state.player).toBe('kodi');
      expect(state.posterUrl).toBe('https://example.com/movies/avengers.jpg');
    });

    it('extracts and decodes Kodi image URLs correctly', () => {
      const payload = JSON.stringify({
        val: 'Test Movie',
        kodi_details: {
          title: 'Test Movie',
          type: 'movie',
          art: {
            poster:
              'image://https%3a%2f%2ffiles.kodi.tv%2fmovies%2fSpaces%20Movie.jpg%2f',
          },
          streamdetails: {
            video: [{ width: 1920, height: 1080, aspect: 1.78, codec: 'h264' }],
            audio: [{ channels: 2, codec: 'aac' }],
          },
        },
      });

      store.apply({ topic: config.topics.kodiTitle, payload }, config.topics);
      const state = store.snapshot();

      expect(state.posterUrl).toBe('https://files.kodi.tv/movies/Spaces Movie.jpg');
    });

    it('parses Kodi progress payload', () => {
      const payload = JSON.stringify({
        val: '62.3',
        kodi_time: '01:23:45',
        kodi_totaltime: '02:30:00',
      });

      store.apply({ topic: config.topics.kodiProgress, payload }, config.topics);
      const state = store.snapshot();

      expect(state.progress).toBe(62.3);
      expect(state.player).toBe('kodi');
    });

    it('clamps Kodi progress between 0 and 100', () => {
      store.apply({ topic: config.topics.kodiProgress, payload: JSON.stringify({ val: '150' }) }, config.topics);
      expect(store.snapshot().progress).toBe(100);

      store.apply({ topic: config.topics.kodiProgress, payload: JSON.stringify({ val: '-10' }) }, config.topics);
      expect(store.snapshot().progress).toBe(0);
    });

    it('parses Kodi playback state', () => {
      store.apply(
        { topic: config.topics.kodiPlaybackState, payload: JSON.stringify({ kodi_state: 'started', val: 1 }) },
        config.topics,
      );
      expect(store.snapshot().player).toBe('kodi');

      store.apply(
        { topic: config.topics.kodiPlaybackState, payload: JSON.stringify({ kodi_state: 'stopped', val: 0 }) },
        config.topics,
      );
      expect(store.snapshot().player).toBe('kodi');
    });
  });

  describe('Weather payload parsing', () => {
    it('parses Home Assistant weather format', () => {
      const payload = JSON.stringify({
        state: 'cloudy',
        attributes: {
          temperature: 18.5,
          humidity: 65,
          wind_speed: 12.3,
        },
      });

      store.apply({ topic: config.topics.weather, payload }, config.topics);
      const state = store.snapshot();

      expect(state.weather).toBeDefined();
      expect(state.weather?.state).toBe('cloudy');
      expect(state.weather?.temperature).toBe(18.5);
      expect(state.weather?.humidity).toBe(65);
      expect(state.weather?.windSpeed).toBe(12.3);
    });

    it('uses defaults for missing weather fields', () => {
      const payload = JSON.stringify({ state: 'unknown' });

      store.apply({ topic: config.topics.weather, payload }, config.topics);
      const state = store.snapshot();

      expect(state.weather?.temperature).toBe(0);
      expect(state.weather?.humidity).toBe(0);
      expect(state.weather?.windSpeed).toBe(0);
    });
  });

  describe('Simple payload parsing', () => {
    it('parses poster URL', () => {
      store.apply({ topic: config.topics.poster, payload: 'https://example.com/poster.jpg' }, config.topics);
      expect(store.snapshot().posterUrl).toBe('https://example.com/poster.jpg');
    });

    it('parses progress as float and clamps', () => {
      store.apply({ topic: config.topics.progress, payload: '50.75' }, config.topics);
      expect(store.snapshot().progress).toBe(50.75);

      store.apply({ topic: config.topics.progress, payload: '120' }, config.topics);
      expect(store.snapshot().progress).toBe(100);
    });

    it('parses temperature', () => {
      store.apply({ topic: config.topics.temperature, payload: '22.5' }, config.topics);
      expect(store.snapshot().temperature).toBe('22.5');
    });

    it('handles URL-encoded poster URLs', () => {
      const encoded = 'https://example.com/posters/My%20Poster.jpg';
      store.apply({ topic: config.topics.poster, payload: encoded }, config.topics);
      expect(store.snapshot().posterUrl).toBe('https://example.com/posters/My Poster.jpg');
    });
  });

  describe('Error handling', () => {
    it('sets error state on malformed JSON', () => {
      store.apply({ topic: config.topics.details, payload: 'not valid json' }, config.topics);
      expect(store.snapshot().error).toContain('Failed to parse details payload');
    });

    it('continues processing after parsing error', () => {
      store.apply({ topic: config.topics.details, payload: 'invalid' }, config.topics);
      store.apply({ topic: config.topics.poster, payload: 'https://example.com/good.jpg' }, config.topics);

      const state = store.snapshot();
      expect(state.posterUrl).toBe('https://example.com/good.jpg');
      expect(state.error).toContain('Failed');
    });
  });

  describe('State timestamp tracking', () => {
    it('updates updatedAt timestamp on state changes', async () => {
      const initialState = store.snapshot();
      const initialTime = new Date(initialState.updatedAt).getTime();

      // Add small delay to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      store.apply({ topic: config.topics.poster, payload: 'https://example.com/test.jpg' }, config.topics);

      const newState = store.snapshot();
      const newTime = new Date(newState.updatedAt).getTime();

      expect(newTime).toBeGreaterThan(initialTime);
    });
  });
});
