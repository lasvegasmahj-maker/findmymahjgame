declare module "react-simple-maps" {
  import { ComponentType, ReactNode, CSSProperties, MouseEvent } from "react";

  interface ProjectionConfig {
    center?: [number, number];
    scale?: number;
    rotate?: [number, number, number];
  }

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    width?: number;
    height?: number;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
  }

  interface GeographiesChildrenArgs {
    geographies: GeographyObject[];
  }

  interface GeographiesProps {
    geography: string | Record<string, unknown>;
    children: (args: GeographiesChildrenArgs) => ReactNode;
    className?: string;
  }

  interface GeographyObject {
    rsmKey: string;
    id: string;
    properties: Record<string, unknown>;
    type: string;
    geometry: unknown;
  }

  interface GeographyStyleState {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    outline?: string;
    transition?: string;
    cursor?: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type RSMEvent = any;

  interface GeographyProps {
    geography: GeographyObject;
    onMouseEnter?: (event: RSMEvent) => void;
    onMouseMove?: (event: RSMEvent) => void;
    onMouseLeave?: (event: RSMEvent) => void;
    onMouseDown?: (event: RSMEvent) => void;
    onMouseUp?: (event: RSMEvent) => void;
    onFocus?: (event: RSMEvent) => void;
    onBlur?: (event: RSMEvent) => void;
    style?: {
      default?: GeographyStyleState;
      hover?: GeographyStyleState;
      pressed?: GeographyStyleState;
    };
    className?: string;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
    className?: string;
    onMouseEnter?: (event: RSMEvent) => void;
    onMouseLeave?: (event: RSMEvent) => void;
    onClick?: (event: RSMEvent) => void;
  }
  export const Marker: ComponentType<MarkerProps>;
  export const ZoomableGroup: ComponentType<Record<string, unknown>>;
  export const Line: ComponentType<Record<string, unknown>>;
  export const Annotation: ComponentType<Record<string, unknown>>;
  export const Sphere: ComponentType<Record<string, unknown>>;
  export const Graticule: ComponentType<Record<string, unknown>>;
}
