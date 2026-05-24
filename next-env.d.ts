/// <reference types="@types/node" />
/// <reference types="next" />
/// <reference types="next/image"

import { ImageProps, NextImageDescriptor } from 'next/image';

declare module 'next' {
  interface ImageProps extends ImageProps {}
}
