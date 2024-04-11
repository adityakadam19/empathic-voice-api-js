// cspell:ignore dataavailable
import type { MimeType } from '@humeai/voice';
import {
  checkForAudioTracks,
  getAudioInputDevices,
  getAudioStream,
  getSupportedMimeType,
} from '@humeai/voice';
import Meyda from 'meyda';
import type { MeydaFeaturesObject } from 'meyda';
import { useCallback, useEffect, useRef, useState } from 'react';

import { generateEmptyFft } from './generateEmptyFft';

type PermissionStatus = 'prompt' | 'granted' | 'denied';

function getDefaultDevice(devices: MediaDeviceInfo[]) {
  const defaultDevice = devices.filter(
    ({ deviceId }) => deviceId === 'default',
  )[0];
  return defaultDevice ?? devices[0];
}

export type MicrophoneProps = {
  // streamRef: MutableRefObject<MediaStream | null>;
  onAudioCaptured: (b: ArrayBuffer) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onError: (message: string) => void;
};

export const useMicrophone = (props: MicrophoneProps) => {
  const { onAudioCaptured, onError } = props;
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);

  const [fft, setFft] = useState<number[]>(generateEmptyFft());
  const currentAnalyzer = useRef<Meyda.MeydaAnalyzer | null>(null);
  const mimeTypeRef = useRef<MimeType | null>(null);

  const audioContext = useRef<AudioContext | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);

  const sendAudio = useRef(onAudioCaptured);
  sendAudio.current = onAudioCaptured;

  const [permission, setPermission] = useState<PermissionStatus>('prompt');

  const streamRef = useRef<MediaStream | null>(null);

  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<
    MediaDeviceInfo | undefined
  >();
  const [defaultInputDevice, setDefaultInputDevice] = useState<
    MediaDeviceInfo | undefined
  >();

  const updateInputDeviceList = useCallback(async () => {
    try {
      const devices = await getAudioInputDevices();
      console.log('GOT LIST OF DEVICES', devices);
      const defaultDevice = getDefaultDevice(devices ?? []);
      setInputDevices(devices);
      setSelectedInputDevice(defaultDevice);
      setDefaultInputDevice(defaultDevice);
      return { defaultDevice };
    } catch (e) {
      return { defaultDevice: null };
    }
  }, []);

  // useEffect(() => {
  //   const onDeviceChange = () => {
  //     console.log('device change');
  //     void getInputDevices().then(({ defaultDevice }) => {
  //       if (defaultDevice) {
  //         changeInputDevice(defaultDevice?.deviceId);
  //       }
  //     });
  //   };
  //   navigator.mediaDevices.ondevicechange = debounce(onDeviceChange, 500);

  //   return () => {
  //     navigator.mediaDevices.ondevicechange = null;
  //   };
  // }, []);

  const getStream = useCallback(async (deviceId?: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await getAudioStream(deviceId);
      console.log('GETTING NEW STREAM', deviceId, stream);

      setPermission('granted');
      streamRef.current = stream;

      checkForAudioTracks(stream);

      return 'granted' as const;
    } catch (e) {
      setPermission('denied');
      return 'denied' as const;
    }
  }, []);

  const dataHandler = useCallback((event: BlobEvent) => {
    if (isMutedRef.current) {
      // Do not send audio if the microphone is muted
      return;
    }

    const blob = event.data;

    blob
      .arrayBuffer()
      .then((buffer) => {
        if (buffer.byteLength > 0) {
          // console.log('audio', buffer.byteLength);
          sendAudio.current?.(buffer);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const startFftAnalyzer = useCallback((stream: MediaStream) => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }

    const input = audioContext.current.createMediaStreamSource(stream);

    if (currentAnalyzer.current) {
      currentAnalyzer.current.setSource(input);
      currentAnalyzer.current.start();
    } else {
      try {
        currentAnalyzer.current = Meyda.createMeydaAnalyzer({
          audioContext: audioContext.current,
          source: input,
          featureExtractors: ['loudness'],
          callback: (features: MeydaFeaturesObject) => {
            console.log('got new features', features);
            const newFft = features.loudness.specific || [];
            setFft(() => Array.from(newFft));
          },
        });

        console.log('starting analyzer on', stream);

        currentAnalyzer.current.start();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        console.error(`Failed to start mic analyzer: ${message}`);
      }
    }
  }, []);

  const start = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) {
      throw new Error('No stream connected');
    }

    startFftAnalyzer(stream);

    const mimeType = mimeTypeRef.current;
    if (!mimeType) {
      throw new Error('No MimeType specified');
    }

    console.log('CREATING new recorder');

    recorder.current = new MediaRecorder(stream, {
      mimeType,
    });
    recorder.current.addEventListener('dataavailable', dataHandler);
    recorder.current.start(100);
    console.log('started recording');
  }, [dataHandler, streamRef, mimeTypeRef, startFftAnalyzer]);

  const stop = useCallback(() => {
    try {
      if (currentAnalyzer.current) {
        currentAnalyzer.current.stop();
      }

      if (audioContext.current) {
        // Suspend the audio context instead of stopping it. We want
        // to keep the audio context alive so that Safari doesn't
        // throw an error when the microphone stream changes.
        void audioContext.current.suspend().catch(() => {
          // .close() rejects if the audio context is already closed.
          // Therefore, we just need to catch the error, but we don't need to
          // do anything with it.
          return null;
        });
      }

      recorder.current?.stop();
      recorder.current?.removeEventListener('dataavailable', dataHandler);
      recorder.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());

      setIsMuted(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      onError(`Error stopping microphone: ${message}`);
      console.log(e);
      void true;
    }
  }, [dataHandler, onError, streamRef]);

  const mute = useCallback(() => {
    if (currentAnalyzer.current) {
      currentAnalyzer.current.stop();
      setFft(generateEmptyFft());
    }

    streamRef.current?.getTracks().forEach((track) => {
      track.enabled = false;
    });

    isMutedRef.current = true;
    setIsMuted(true);
  }, [streamRef]);

  const unmute = useCallback(() => {
    if (currentAnalyzer.current) {
      currentAnalyzer.current.start();
    }

    streamRef.current?.getTracks().forEach((track) => {
      track.enabled = true;
    });

    isMutedRef.current = false;
    setIsMuted(false);
  }, [streamRef]);

  const changeInputDevice = useCallback(
    (id: string) => {
      const matchingDevice = inputDevices.find(
        ({ deviceId }) => deviceId === id,
      );
      if (matchingDevice) {
        setSelectedInputDevice(matchingDevice);
      }

      stop();
      void getStream(id).then(() => {
        start();
      });
    },
    [inputDevices, stop, getStream, start],
  );

  useEffect(() => {
    return () => {
      try {
        recorder.current?.stop();
        recorder.current?.removeEventListener('dataavailable', dataHandler);

        if (currentAnalyzer.current) {
          currentAnalyzer.current.stop();
          currentAnalyzer.current = null;
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      } catch (e) {
        console.log(e);
        void true;
      }
    };
  }, [dataHandler, streamRef]);

  useEffect(() => {
    const mimeTypeResult = getSupportedMimeType();
    if (mimeTypeResult.success) {
      mimeTypeRef.current = mimeTypeResult.mimeType;
    } else {
      onError(mimeTypeResult.error.message);
    }
  }, [onError]);

  return {
    start,
    stop,
    mute,
    unmute,
    isMuted,
    fft,
    getStream,
    permission,
    updateInputDeviceList,
    inputDevices,
    selectedInputDevice,
    changeInputDevice,
    defaultInputDevice,
  };
};
