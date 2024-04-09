// cspell:ignore dataavailable
import {
  checkForAudioTracks,
  getAudioInputDevices,
  getAudioStream,
} from '@humeai/voice';
import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from '../utils';

type PermissionStatus = 'prompt' | 'granted' | 'denied';

function getDefaultDevice(devices: MediaDeviceInfo[]) {
  const defaultDevice = devices.filter(
    ({ deviceId }) => deviceId === 'default',
  )[0];
  return defaultDevice ?? devices[0];
}

export const useMicrophoneStream = () => {
  const [permission, setPermission] = useState<PermissionStatus>('prompt');

  const streamRef = useRef<MediaStream | null>(null);

  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<
    MediaDeviceInfo | undefined
  >();
  const [defaultInputDevice, setDefaultInputDevice] = useState<
    MediaDeviceInfo | undefined
  >();

  const getInputDevices = useCallback(async () => {
    try {
      const devices = await getAudioInputDevices();
      const defaultDevice = getDefaultDevice(devices ?? []);
      setInputDevices(devices);
      setSelectedInputDevice(defaultDevice);
      setDefaultInputDevice(defaultDevice);
      return { defaultDevice };
    } catch (e) {
      return { defaultDevice: null };
    }
  }, []);

  const onSelectInputDevice = useCallback(
    (id: string) => {
      const matchingDevice = inputDevices.find(
        ({ deviceId }) => deviceId === id,
      );
      if (matchingDevice) {
        setSelectedInputDevice(matchingDevice);
      }
    },
    [inputDevices],
  );

  useEffect(() => {
    const onDeviceChange = () => {
      console.log('device change');
      void getInputDevices().then(({ defaultDevice }) => {
        void getStream(defaultDevice?.deviceId);
      });
    };
    navigator.mediaDevices.ondevicechange = debounce(onDeviceChange, 500);

    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, []);

  const getStream = useCallback(async (deviceId: string | undefined) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await getAudioStream(deviceId);
      console.log('GETTING STREAM', deviceId, stream);

      setPermission('granted');
      streamRef.current = stream;

      checkForAudioTracks(stream);

      return 'granted' as const;
    } catch (e) {
      setPermission('denied');
      return 'denied' as const;
    }
  }, []);

  return {
    streamRef,
    getStream,
    permission,
    getInputDevices,
    inputDevices,
    selectedInputDevice,
    onSelectInputDevice,
    defaultInputDevice,
  };
};
