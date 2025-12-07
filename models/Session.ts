import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  arbitrationId: mongoose.Types.ObjectId;
  zkFetchMethod: 'GET' | 'POST';
  publicParams: {
    headers?: Record<string, string>;
    body?: Record<string, any>;
  };
  privateParamKeys: {
    headers?: string[];
    body?: string[];
  };
  prompt: string;
  apiProofResponse: any;
  claudeProofResponse: any;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    arbitrationId: { type: Schema.Types.ObjectId, ref: 'Arbitration', required: true },
    zkFetchMethod: { type: String, enum: ['GET', 'POST'], required: true },
    publicParams: {
      headers: { type: Map, of: String },
      body: { type: Schema.Types.Mixed },
    },
    privateParamKeys: {
      headers: [{ type: String }],
      body: [{ type: String }],
    },
    prompt: { type: String, required: true },
    apiProofResponse: { type: Schema.Types.Mixed, required: true },
    claudeProofResponse: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
  }
);

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;
