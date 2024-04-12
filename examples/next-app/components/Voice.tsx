'use client';
import { VoiceProvider } from '@humeai/voice-react';
import { useState } from 'react';

import { ExampleComponent } from '@/components/ExampleComponent';

export const Voice = ({ accessToken }: { accessToken: string }) => {
  const [hostname, setHostname] = useState(
    process.env.NEXT_PUBLIC_HUME_VOICE_HOSTNAME || 'api.hume.ai',
  );
  return (
    <>
      <VoiceProvider
        auth={{ type: 'accessToken', value: accessToken }}
        hostname={hostname}
        messageHistoryLimit={10}
        onMessage={(message) => {
          // eslint-disable-next-line no-console
          console.log('message', message);
        }}
        onClose={(event) => {
          const niceClosure = 1000;
          const code = event.code;

          if (code !== niceClosure) {
            // eslint-disable-next-line no-console
            console.error('close event was not nice', event);
          }
        }}
      >
        <ExampleComponent hostname={hostname} setHostname={setHostname} />
      </VoiceProvider>
    </>
  );
};
