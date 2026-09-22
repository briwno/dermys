declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css';

declare module 'react-dom' {
  import type { ReactNode } from 'react';
  export function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: null | string): React.ReactPortal;
}

