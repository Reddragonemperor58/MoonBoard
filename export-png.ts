import html2canvas from 'html2canvas';

/**
 * Exports an HTML element as a PNG image
 * @param element The HTML element to export
 * @param backgroundColor Optional background color for the exported image
 * @returns Promise that resolves when the download has started
 */
export const exportElementAsPNG = async (
  element: HTMLElement | null, 
  backgroundColor: string = '#ffffff'
): Promise<void> => {
  // Validate element
  if (!element) {
    throw new Error('Element not found for export');
  }

  try {
    // Capture the element using html2canvas
    const canvas = await html2canvas(element, {
      allowTaint: true,
      useCORS: true,
      scale: 2, // Higher quality
      backgroundColor: backgroundColor
    });

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create download link
    const link = document.createElement('a');
    link.download = `moodboard-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    
    // Append to body, click, then remove (to ensure it works in all browsers)
    document.body.appendChild(link);
    link.click();
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
    
    return Promise.resolve();
  } catch (error) {
    console.error('PNG export error:', error);
    throw error;
  }
};
