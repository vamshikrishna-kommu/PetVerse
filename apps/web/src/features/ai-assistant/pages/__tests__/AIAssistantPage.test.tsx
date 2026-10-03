import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIAssistantPage from '../AIAssistantPage';
import { renderWithProviders } from '@/test/test-utils';
import { aiApi } from '@/services/api/aiApi';

vi.mock('@/features/pets/hooks/usePets', () => ({
  usePets: () => ({
    data: {
      data: [
        {
          _id: 'pet_1',
          name: 'Charlie',
          species: 'dog',
          breed: 'Golden Retriever',
          weight: 30,
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('@/services/api/aiApi', () => ({
  aiApi: {
    chat: vi.fn(),
    analyzeSymptoms: vi.fn(),
    identifyBreed: vi.fn(),
    calculateDiet: vi.fn(),
  },
}));

describe('AIAssistantPage Component & Clinical Guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AI Assistant header, active tab, and prompt chips', () => {
    renderWithProviders(<AIAssistantPage />);

    expect(screen.getByText(/AI Assistant & Clinical Triage/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Chat Assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/Symptom Checker/i)).toBeInTheDocument();
    expect(screen.getByText(/What human foods are toxic to dogs\?/i)).toBeInTheDocument();
  });

  it('switches between AI Chat Assistant and Symptom Checker tabs', () => {
    renderWithProviders(<AIAssistantPage />);

    const symptomCheckerBtn = screen.getByRole('button', { name: /Symptom Checker/i });
    fireEvent.click(symptomCheckerBtn);

    expect(screen.getByText(/Observed Symptoms/i)).toBeInTheDocument();
    expect(screen.getByText(/Duration & Severity/i)).toBeInTheDocument();
  });

  it('sends user message and displays assistant response with disclaimer', async () => {
    (aiApi.chat as any).mockResolvedValueOnce({
      message: 'Dogs should never eat chocolate, onions, or grapes.',
      isEmergency: false,
      detectedRedFlags: [],
      suggestedActions: ['Keep toxic foods stored in high pantries'],
      disclaimer: 'Informational veterinary guide.',
      generatedBy: 'external_ai_model',
    });

    renderWithProviders(<AIAssistantPage />);

    const input = screen.getByPlaceholderText(/Ask PetVerse AI about diet/i);
    fireEvent.change(input, { target: { value: 'Can my dog eat grapes?' } });

    const sendBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Dogs should never eat chocolate/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/PetVerse AI provides educational triage guidance/i)).toBeInTheDocument();
  });

  it('displays emergency alert banner when AI detects acute red-flag symptoms', async () => {
    (aiApi.chat as any).mockResolvedValueOnce({
      message: 'CRITICAL EMERGENCY: Rat poison ingestion requires immediate treatment.',
      isEmergency: true,
      detectedRedFlags: ['poison'],
      suggestedActions: ['Go to emergency clinic immediately'],
      disclaimer: 'Informational veterinary guide.',
      generatedBy: 'clinical_rule_engine',
    });

    renderWithProviders(<AIAssistantPage />);

    const input = screen.getByPlaceholderText(/Ask PetVerse AI about diet/i);
    fireEvent.change(input, { target: { value: 'My dog ate rat poison!' } });

    const sendBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Critical Clinical Alert Detected/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Emergency Center/i })).toBeInTheDocument();
    });
  });
});
