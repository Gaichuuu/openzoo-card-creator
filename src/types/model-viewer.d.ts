import 'react';

type ModelViewerAttributes = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement> & {
    src?: string;
    alt?: string;
    poster?: string;
    'auto-rotate'?: boolean | '';
    'rotation-per-second'?: string;
    'camera-controls'?: boolean | '';
    'camera-orbit'?: string;
    'field-of-view'?: string;
    'shadow-intensity'?: string;
    'environment-image'?: string;
    exposure?: string;
    'min-camera-orbit'?: string;
    'max-camera-orbit'?: string;
    'interaction-prompt'?: string;
    'disable-zoom'?: boolean | '';
    'disable-pan'?: boolean | '';
    'disable-tap'?: boolean | '';
    ref?: React.Ref<HTMLElement>;
  },
  HTMLElement
>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes;
    }
  }
}
