import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BreedScanPage from '../BreedScanPage';
import { renderWithProviders } from '@/test/test-utils';
import { aiApi } from '@/services/api/aiApi';

vi.mock('@/services/api/aiApi', () => ({
  aiApi: {
    identifyBreed: vi.fn(),
  },
}));

describe('BreedScanPage Component & Multimodal Classification', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    class MockFileReader {
      onload: ((e: { target: { result: string } }) => void) | null = null;
      readAsDataURL() {
        Promise.resolve().then(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,dGVzdA==' } });
          }
        });
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);
  });

  it('renders Breed Scanner header, species selectors, and upload container', () => {
    renderWithProviders(<BreedScanPage />);

    expect(screen.getByText(/Visual Breed Scanner & Multimodal AI/i)).toBeInTheDocument();
    expect(screen.getByText(/✨ Auto-Detect/i)).toBeInTheDocument();
    expect(screen.getByText(/🐶 Dog/i)).toBeInTheDocument();
    expect(screen.getByText(/🐱 Cat/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Upload Photo/i })).toBeInTheDocument();
    expect(screen.getByText(/Click to upload photo/i)).toBeInTheDocument();
  });

  it('displays unsupported card and no breed card when a person image is classified', async () => {
    const mockResponse = {
      species: 'PERSON',
      isPetSupported: false,
      breed: null,
      confidence: 0.98,
      uncertain: false,
      explanation: 'This image appears to contain a person, not a dog or cat. Please upload a clear photo of a dog or cat for breed identification.',
      characteristics: null,
      secondaryBreeds: [],
      healthConsiderations: [],
      careTips: [],
      disclaimer: 'Breed prediction is estimated by visual model analysis.',
      generatedBy: 'external_ai_model',
    };
    (aiApi.identifyBreed as any).mockImplementation(() => Promise.resolve(mockResponse));

    renderWithProviders(<BreedScanPage />);

    const file = new File(['dummy'], 'person.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    const scanBtn = await screen.findByRole('button', { name: /Scan Image with Gemini AI/i });
    await waitFor(() => {
      expect(scanBtn).not.toBeDisabled();
    });

    fireEvent.click(scanBtn);

    await waitFor(() => {
      expect(screen.getByText(/👤 Person Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/This doesn't appear to be a dog or cat/i)).toBeInTheDocument();
      expect(screen.getByText(/Please upload a clear photo of a dog or cat/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Another Image/i })).toBeInTheDocument();
    });

    // Verify no breed card or Golden Retriever fallback is rendered
    expect(screen.queryByText(/Primary Match/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Golden Retriever/i)).not.toBeInTheDocument();
  });

  it('displays breed card when valid dog breed is identified', async () => {
    const mockBreedResponse = {
      species: 'DOG',
      isPetSupported: true,
      breed: 'Labrador Retriever',
      primaryBreed: 'Labrador Retriever',
      confidence: 0.92,
      uncertain: false,
      explanation: 'Broad skull, friendly expression, and short dense water-resistant coat.',
      characteristics: {
        energyLevel: 'High',
        groomingNeeds: 'Moderate',
        temperament: ['Outgoing', 'Even Tempered', 'Gentle'],
        typicalWeightRangeKg: { min: 25, max: 36 },
        lifeExpectancyYears: { min: 10, max: 12 },
        visualTraits: ['Otter tail', 'Broad muzzle'],
      },
      secondaryBreeds: [],
      healthConsiderations: ['Hip Dysplasia'],
      careTips: ['Daily exercise recommended'],
      disclaimer: 'Breed prediction is estimated by visual model analysis. DNA genetic tests provide 100% definitive heritage.',
      generatedBy: 'external_ai_model',
    };
    (aiApi.identifyBreed as any).mockImplementation(() => Promise.resolve(mockBreedResponse));

    renderWithProviders(<BreedScanPage />);

    const file = new File(['dummy'], 'labrador.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    const scanBtn = await screen.findByRole('button', { name: /Scan Image with Gemini AI/i });
    await waitFor(() => {
      expect(scanBtn).not.toBeDisabled();
    });

    fireEvent.click(scanBtn);

    await waitFor(() => {
      expect(screen.getByText('Labrador Retriever')).toBeInTheDocument();
    });

    expect(screen.getByText(/Visual Match \(92%\)/i)).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText(/🐶 Canine/i)).toBeInTheDocument();
    expect(screen.getByText(/Broad skull, friendly expression/i)).toBeInTheDocument();
    expect(screen.getByText(/Otter tail/i)).toBeInTheDocument();
    expect(screen.getByText(/Outgoing/i)).toBeInTheDocument();
  });
});
