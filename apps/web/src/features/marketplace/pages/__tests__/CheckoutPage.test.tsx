import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CheckoutPage from '../CheckoutPage';
import { renderWithProviders } from '@/test/test-utils';
import { useMarketplaceCartStore } from '../../store/cart.store';

vi.mock('../../hooks/useMarketplace', () => ({
  useCreateOrder: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useVerifyPayment: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('CheckoutPage Component', () => {
  beforeEach(() => {
    useMarketplaceCartStore.setState({
      items: [],
      isCartOpen: false,
    });
  });

  it('renders empty cart notice when cart has no items', () => {
    renderWithProviders(<CheckoutPage />);
    expect(screen.getByText('Your Cart is Empty')).toBeInTheDocument();
    expect(screen.getByText('Explore Marketplace')).toBeInTheDocument();
  });

  it('renders delivery address form and order summary when cart has items', () => {
    useMarketplaceCartStore.setState({
      items: [
        {
          product: {
            _id: 'prod_1',
            name: 'Royal Canin Maxi Adult Dog Food',
            description: 'Balanced diet for large breed dogs',
            category: 'food',
            price: 2499,
            currency: 'INR',
            stock: 20,
            images: ['https://images.unsplash.com/photo-1.jpg'],
            rating: 4.8,
            reviewsCount: 15,
            petSpecies: ['dog'],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          quantity: 1,
        },
      ],
      isCartOpen: false,
    });

    renderWithProviders(<CheckoutPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Checkout' })).toBeInTheDocument();
    expect(screen.getByText('1. Delivery Address (India)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 9849012345')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('500081')).toBeInTheDocument();
    expect(screen.getByText('Royal Canin Maxi Adult Dog Food')).toBeInTheDocument();
    expect(screen.getAllByText(/FREE/i).length).toBeGreaterThan(0);
  });
});
