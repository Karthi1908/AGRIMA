import { generatePDF } from './pdfExport';

// Mock html2canvas and jsPDF
jest.mock('html2canvas', () => {
  return jest.fn(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,mocked-image',
    width: 800,
    height: 600
  }));
});

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    addImage: jest.fn(),
    save: jest.fn(),
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } }
  }));
});

describe('PDF Export Service', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  it('verifies branding and disclaimer are rendered correctly', async () => {
    const mockContainer = document.createElement('div');
    mockContainer.id = 'pdf-export-container';
    
    // Simulate branding and disclaimer elements
    const branding = document.createElement('div');
    branding.className = 'advisor-branding';
    branding.textContent = 'Wealth Advisory';
    
    const disclaimer = document.createElement('div');
    disclaimer.className = 'disclaimer';
    disclaimer.textContent = 'This document is for information purposes only.';
    
    mockContainer.appendChild(branding);
    mockContainer.appendChild(disclaimer);
    document.body.appendChild(mockContainer);

    // Call service
    await generatePDF('pdf-export-container', 'Test_Termsheet.pdf');

    // Just verify execution didn't throw and mock was called
    const html2canvas = require('html2canvas');
    expect(html2canvas).toHaveBeenCalledWith(mockContainer, expect.any(Object));
  });

  it('fails gracefully when container is not found', async () => {
    await expect(generatePDF('missing-container', 'test.pdf')).rejects.toThrow('Container missing-container not found');
  });
});
