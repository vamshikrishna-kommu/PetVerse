import React, { useState } from 'react';
import { useFailedEvents, useDispatchEvent } from '../../automation/hooks/useAutomation';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw, Send, Activity } from 'lucide-react';
import { DomainEventType } from '@petverse/shared-types';

export default function EventMonitorDashboard() {
  const { data: failedEvents, isLoading } = useFailedEvents();
  const dispatch = useDispatchEvent();

  const [testPayload, setTestPayload] = useState('{}');
  const [testEventType, setTestEventType] = useState<DomainEventType>(DomainEventType.PetCreated);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(testPayload);
    } catch {
      toast.error('Invalid JSON payload — please fix the syntax before dispatching.');
      return;
    }
    dispatch.mutate(
      {
        aggregateId: 'test-agg-123',
        aggregateType: 'SystemTest',
        eventType: testEventType,
        payload,
      },
      {
        onSuccess: () => toast.success('Event dispatched successfully!'),
        onError: (err: any) =>
          toast.error(`Dispatch failed: ${err?.message ?? 'Server error'}`),
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Event Monitor</h1>
        <p className="text-slate-500">Monitor system events, dead-letter queues, and dispatch manual events.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Failed Events Queue */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-danger" />
              Failed Events (DLQ)
            </h2>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <RefreshCw className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {isLoading ? (
            <p className="text-slate-500">Loading...</p>
          ) : failedEvents?.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border-2 border-dashed rounded-xl">
              <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>Queue is healthy. No failed events.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {failedEvents?.map((ev) => (
                <div key={ev._id} className="p-4 border border-danger/20 bg-danger/5 rounded-xl text-sm">
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-danger">{ev.eventType}</span>
                    <span>{new Date(ev.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-600 mb-2 font-mono text-xs">{ev.aggregateId} ({ev.aggregateType})</p>
                  <p className="text-danger font-medium">Error: {ev.processingError}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Dispatcher */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Send className="w-6 h-6 text-indigo-500" />
            Manual Event Dispatch
          </h2>

          <form onSubmit={handleDispatch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Type</label>
              <select 
                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800"
                value={testEventType}
                onChange={(e) => setTestEventType(e.target.value as DomainEventType)}
              >
                {Object.values(DomainEventType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">JSON Payload</label>
              <textarea 
                className="w-full p-3 border rounded-lg font-mono text-sm h-32 bg-slate-50 dark:bg-slate-800"
                value={testPayload}
                onChange={e => setTestPayload(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex justify-center items-center gap-2"
              disabled={dispatch.isPending}
            >
              <Send className="w-4 h-4" />
              {dispatch.isPending ? 'Dispatching...' : 'Dispatch Event'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
