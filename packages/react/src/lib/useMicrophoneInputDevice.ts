import { getAudioInputDevices } from '@humeai/voice';
import { useCallback, useEffect, useState } from 'react';

function getDefaultDevice(devices: MediaDeviceInfo[]) {
  const defaultDevice = devices.filter(
    ({ deviceId }) => deviceId === 'default',
  )[0];
  return defaultDevice ?? devices[0];
}

export const useMicrophoneInputDevice = () => {
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

  const onChangeInputDevice = useCallback(
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
      void getInputDevices();
    };
    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        onDeviceChange,
      );
    };
  }, [getInputDevices]);

  return {
    getInputDevices,
    inputDevices,
    selectedInputDevice,
    onChangeInputDevice,
    defaultInputDevice,
  };
};
