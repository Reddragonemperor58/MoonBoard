declare module 'html2canvas' {
  export interface Html2CanvasOptions {
    scale?: number;
    logging?: boolean;
    allowTaint?: boolean;
    useCORS?: boolean;
    backgroundColor?: string | null;
    // Add more options as needed
  }

  function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>;
  export default html2canvas;
}

declare module 'jspdf' {
  class jsPDF {
    constructor(options?: {
      orientation?: 'portrait' | 'landscape';
      unit?: 'pt' | 'mm' | 'cm' | 'in' | 'px';
      format?: string | [number, number];
    });
    
    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number
    ): jsPDF;
    
    save(filename?: string): void;

    getImageProperties(imageData: string | HTMLImageElement | HTMLCanvasElement): {
      width: number;
      height: number;
    };

    internal: {
      pageSize: {
        width: number;
        height: number;
      };
    };
  }
  
  export default jsPDF;
}

declare module 'react-zoom-pan-pinch' {
  import { ReactNode } from 'react';

  interface TransformWrapperProps {
    children: ReactNode;
    initialScale?: number;
    minScale?: number;
    maxScale?: number;
    centerOnInit?: boolean;
    doubleClick?: {
      disabled?: boolean;
      mode?: 'reset' | 'zoomIn';
    };
    disabled?: boolean;
    panning?: {
      disabled?: boolean;
    };
    wheel?: {
      step?: number;
    };
    limitToBounds?: boolean;
  }

  interface TransformComponentProps {
    children: ReactNode;
    wrapperStyle?: React.CSSProperties;
    wrapperClass?: string;
    contentClass?: string;
  }

  export const TransformWrapper: React.ForwardRefExoticComponent<TransformWrapperProps & React.RefAttributes<any>>;
  export const TransformComponent: React.FC<TransformComponentProps>;
}

// Extend window interface to include our controls
interface MoodboardControls {
  handleResetZoom: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  toggleSettings: () => void;
  handleExport: () => void;
  handleAddSegment: () => void;
  handleBringToFront: () => void;
  handleSendToBack: () => void;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
  hasSelectedSticker: boolean;
  historyIndex: number;
  historyLength: number;
  exportFormat: 'png' | 'pdf';
}

// Window interface is augmented in controls.ts