import mongoose, { Schema, Model } from 'mongoose';
import { 
  IWorkflowDefinition, 
  IWorkflowExecution, 
  WorkflowStatus 
} from '@petverse/shared-types';

const WorkflowStepSchema = new Schema(
  {
    stepId: { type: String, required: true },
    type: { type: String, required: true }, // action | delay | condition | parallel
    config: { type: Schema.Types.Mixed, required: true },
    nextStepId: { type: String },
  },
  { _id: false }
);

const WorkflowDefinitionSchema = new Schema<IWorkflowDefinition>(
  {
    name: { type: String, required: true },
    description: { type: String },
    steps: { type: [WorkflowStepSchema], required: true },
    startStepId: { type: String, required: true },
    isEnabled: { type: Boolean, default: true, index: true },
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const WorkflowExecutionSchema = new Schema<IWorkflowExecution>(
  {
    workflowId: { type: String, required: true, index: true },
    triggerEventId: { type: String, index: true },
    status: { 
      type: String, 
      enum: Object.values(WorkflowStatus), 
      default: WorkflowStatus.Pending,
      index: true 
    },
    currentStepId: { type: String },
    state: { type: Schema.Types.Mixed, default: {} },
    history: [
      {
        stepId: { type: String, required: true },
        startedAt: { type: String, required: true },
        completedAt: { type: String },
        status: { type: String, enum: ['success', 'failed', 'skipped'], required: true },
        error: { type: String },
      }
    ],
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const WorkflowDefinitionModel: Model<IWorkflowDefinition> = mongoose.models.WorkflowDefinition || mongoose.model<IWorkflowDefinition>('WorkflowDefinition', WorkflowDefinitionSchema);
export const WorkflowExecutionModel: Model<IWorkflowExecution> = mongoose.models.WorkflowExecution || mongoose.model<IWorkflowExecution>('WorkflowExecution', WorkflowExecutionSchema);
