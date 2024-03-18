import type {
  AgentTranscriptMessage,
  Config,
  UserTranscriptMessage,
} from '@humeai/voice';
import { createConfig } from '@humeai/voice';

import type { ClientToFrameAction } from './embed-messages';
import {
  EXPAND_FROM_CLIENT_ACTION,
  FrameToClientActionSchema,
  SEND_WINDOW_SIZE_ACTION,
  UPDATE_CONFIG_ACTION,
  WIDGET_IFRAME_IS_READY_ACTION,
} from './embed-messages';

export type EmbeddedVoiceConfig = {
  rendererUrl: string;
} & Config;

export type TranscriptMessageHandler = (
  message: UserTranscriptMessage | AgentTranscriptMessage,
) => void;

export type CloseHandler = () => void;

export class EmbeddedVoice {
  private iframe: HTMLIFrameElement;

  private isMounted: boolean = false;

  private managedContainer: HTMLElement | null = null;

  private config: EmbeddedVoiceConfig;

  private onMessage: TranscriptMessageHandler;

  private onClose: CloseHandler;

  private constructor({
    onMessage = () => {},
    onClose = () => {},
    ...config
  }: {
    onMessage?: TranscriptMessageHandler;
    onClose?: CloseHandler;
  } & EmbeddedVoiceConfig) {
    this.config = config;
    this.iframe = this.createIframe(config);
    this.onMessage = onMessage;
    this.onClose = onClose;
    this.messageHandler = this.messageHandler.bind(this);
  }

  static create({
    rendererUrl,
    onMessage,
    onClose,
    ...config
  }: Partial<EmbeddedVoiceConfig> & {
    onMessage?: TranscriptMessageHandler;
    onClose?: CloseHandler;
  } & NonNullable<Pick<EmbeddedVoiceConfig, 'auth'>>): EmbeddedVoice {
    const parsedConfig = createConfig(config);

    return new EmbeddedVoice({
      rendererUrl: rendererUrl ?? 'https://voice-widget.hume.ai',
      onMessage,
      onClose,
      ...parsedConfig,
    });
  }

  mount(container?: HTMLElement) {
    const messageHandler = (event: MessageEvent<unknown>) => {
      this.messageHandler(event);
    };

    const resizeHandler = () => {
      this.sendWindowSize();
    };

    const el = container ?? this.createContainer();

    this.managedContainer = el;

    try {
      window.addEventListener('message', messageHandler);
      window.addEventListener('resize', resizeHandler);
      el.appendChild(this.iframe);
      this.isMounted = true;
    } catch (e) {
      this.isMounted = false;
    }

    const unmount = () => {
      try {
        window.removeEventListener('message', messageHandler);
        window.removeEventListener('resize', resizeHandler);
        this.iframe.remove();
        this.isMounted = false;
      } catch (e) {
        this.isMounted = true;
      }

      if (!container) {
        el.remove();
      }
    };

    return unmount;
  }

  private createContainer() {
    const div = document.createElement('div');

    Object.assign(div.style, {
      background: 'transparent',
      position: 'fixed',
      bottom: '0',
      right: '0',
      padding: '24px',
      zIndex: '999999',
      fontSize: '0px',
      pointerEvents: 'none',
    });

    div.id = 'hume-embedded-voice-container';

    document.body.appendChild(div);

    return div;
  }

  private createIframe({ rendererUrl }: EmbeddedVoiceConfig) {
    const el = document.createElement('iframe');

    Object.assign(el.style, {
      backgroundColor: 'transparent',
      backgroundImage: 'none',
      border: 'none',
      height: '0px',
      width: '0px',
      opacity: '0',
    });

    el.id = 'hume-embedded-voice';

    el.src = `${rendererUrl}`;

    el.setAttribute('frameborder', '0');
    el.setAttribute('allowtransparency', 'true');
    el.setAttribute('scrolling', 'no');
    el.setAttribute('allow', 'microphone');

    if (el.contentWindow) {
      el.contentWindow.document.documentElement.style.backgroundColor =
        'transparent';
      el.contentWindow.document.body.style.backgroundColor = 'transparent';
    }

    return el;
  }

  private messageHandler(event: MessageEvent<unknown>) {
    if (!this.iframe) {
      return;
    }

    if (event.origin !== new URL(this.iframe.src).origin) {
      return;
    }

    const action = FrameToClientActionSchema.safeParse(event.data);

    if (!action.success) {
      return;
    }

    switch (action.data.type) {
      case WIDGET_IFRAME_IS_READY_ACTION.type: {
        this.showIframe();
        this.sendConfigObject();
        this.sendWindowSize();
        break;
      }
      case 'resize_frame': {
        this.resizeIframe(action.data.payload);
        break;
      }
      case 'transcript_message': {
        this.onMessage(action.data.payload);
        break;
      }
      case 'collapse_widget': {
        this.onClose();
        break;
      }
    }
  }

  openEmbed() {
    const action = EXPAND_FROM_CLIENT_ACTION({
      width: window.document.body.clientWidth,
      height: window.document.body.clientHeight,
    });
    this.sendMessageToFrame(action);
  }

  private sendConfigObject() {
    const action = UPDATE_CONFIG_ACTION(this.config);
    this.sendMessageToFrame(action);
  }

  private sendWindowSize() {
    const action = SEND_WINDOW_SIZE_ACTION({
      width: window.document.body.clientWidth,
      height: window.document.body.clientHeight,
    });
    this.sendMessageToFrame(action);
  }

  private sendMessageToFrame(action: ClientToFrameAction) {
    const frame = this.iframe;

    if (!frame.contentWindow) {
      return;
    }

    frame.contentWindow.postMessage(action, new URL(frame.src).origin);
  }

  private showIframe() {
    this.iframe.style.opacity = '1';
    if (this.managedContainer) {
      this.managedContainer.style.pointerEvents = 'all';
    }
  }

  private hideIframe() {
    this.iframe.style.opacity = '0';
    if (this.managedContainer) {
      this.managedContainer.style.pointerEvents = 'none';
    }
  }

  private resizeIframe({ width, height }: { width: number; height: number }) {
    this.iframe.style.width = `${width}px`;
    this.iframe.style.height = `${height}px`;
  }
}
