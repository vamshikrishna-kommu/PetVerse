import React, { useState } from 'react';
import { useAutomationRules, useCreateAutomationRule } from '../../automation/hooks/useAutomation';

import { Zap, Plus, Workflow, Play, Settings } from 'lucide-react';
import { DomainEventType, AutomationPriority } from '@petverse/shared-types';

export default function AutomationBuilder() {
  const { data: rules, isLoading } = useAutomationRules();
  const createRule = useCreateAutomationRule();
  const [isCreating, setIsCreating] = useState(false);

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    triggerEvent: DomainEventType.MedicalRecordCreated,
    priority: AutomationPriority.Normal,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createRule.mutate({
      ...newRule,
      conditions: {}, // Unconditional trigger for matching domain event
      actions: [{ type: 'send_notification', config: { message: 'Automated Rule Triggered!' } }]
    }, {
      onSuccess: () => {
        setIsCreating(false);
        setNewRule({ ...newRule, name: '', description: '' });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Automation Builder</h1>
          <p className="text-slate-500">Create 'If This Then That' rules triggered by system events.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
        >
          {isCreating ? 'Cancel' : <><Plus className="w-4 h-4"/> New Rule</>}
        </button>
      </div>

      {isCreating && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <Zap className="w-5 h-5" />
            Create Automation Rule
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rule Name</label>
              <input required type="text" className="w-full p-2 border rounded-lg" 
                value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trigger Event</label>
              <select className="w-full p-2 border rounded-lg"
                value={newRule.triggerEvent} onChange={e => setNewRule({...newRule, triggerEvent: e.target.value as DomainEventType})}
              >
                {Object.values(DomainEventType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <input type="text" className="w-full p-2 border rounded-lg" 
                value={newRule.description} onChange={e => setNewRule({...newRule, description: e.target.value})} 
              />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" disabled={createRule.isPending} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                {createRule.isPending ? 'Saving...' : 'Save Rule'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Loading rules...</p>
        ) : (
          rules?.map(rule => (
            <div key={rule._id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{rule.name}</h4>
                <div className={`px-2 py-1 text-xs font-bold rounded-full ${rule.isEnabled ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>
                  {rule.isEnabled ? 'Active' : 'Disabled'}
                </div>
              </div>
              
              <p className="text-sm text-slate-500 mb-4 h-10">{rule.description}</p>
              
              <div className="space-y-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Play className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium">Trigger:</span>
                  <span className="font-mono text-xs truncate" title={rule.triggerEvent}>{rule.triggerEvent}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Workflow className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">Actions:</span>
                  <span>{rule.actions.length} defined</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1">
                  <Settings className="w-4 h-4" /> Edit Configuration
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
