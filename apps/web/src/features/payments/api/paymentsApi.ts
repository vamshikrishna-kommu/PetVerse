import api from '@/shared/lib/axios';

export interface CheckoutSessionResponse {
  transactionId: string;
  sessionId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  appointmentId: string;
  status: string;
}

export interface PaymentTransactionItem {
  _id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  provider: string;
  createdAt: string;
}

export const paymentsApi = {
  createCheckoutSession: async (
    appointmentId: string,
    returnUrl?: string
  ): Promise<CheckoutSessionResponse> => {
    const response = await api.post<{ success: boolean; data: CheckoutSessionResponse }>(
      '/payments/checkout-session',
      {
        appointmentId,
        returnUrl,
      }
    );
    return response.data.data;
  },

  confirmPayment: async (transactionId: string): Promise<ConfirmPaymentResponse> => {
    const response = await api.post<{ success: boolean; data: ConfirmPaymentResponse }>(
      '/payments/confirm',
      {
        transactionId,
      }
    );
    return response.data.data;
  },

  getHistory: async (): Promise<PaymentTransactionItem[]> => {
    const response = await api.get<{ success: boolean; data: PaymentTransactionItem[] }>(
      '/payments/history'
    );
    return response.data.data;
  },
};
