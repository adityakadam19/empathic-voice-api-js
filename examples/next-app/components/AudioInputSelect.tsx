import type { useVoice } from '@humeai/voice-react';
import type { FC } from 'react';
import { memo } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/Select';

type AudioInputSelectProps = {
  inputDevices: ReturnType<typeof useVoice>['inputDevices'];
  selectedInputDevice: ReturnType<typeof useVoice>['selectedInputDevice'];
  changeInputDevice: ReturnType<typeof useVoice>['changeInputDevice'];
};

export const AudioInputSelect: FC<AudioInputSelectProps> = memo((props) => {
  const { inputDevices, selectedInputDevice, changeInputDevice } = props;
  return (
    <Select
      value={selectedInputDevice?.deviceId}
      onValueChange={(value: string) => {
        changeInputDevice(value);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select microphone input" />
      </SelectTrigger>
      <SelectContent className="bg-white">
        {inputDevices.map((device) => {
          return (
            <SelectItem
              key={device.deviceId || 'unknown'}
              value={device.deviceId || 'unknown'}
              className="text-gray-900"
            >
              {device.label ?? 'unknown'} {device.deviceId ?? '[?]'}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
});

AudioInputSelect.displayName = 'AudioInputSelect';
