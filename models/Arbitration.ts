import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IArbitration extends Document {
  name: string;
  apiUrl: string;
  zkFetchMethod: 'GET' | 'POST';
  publicParams: {
    headers?: Record<string, string>;
    body?: Record<string, any>;
  };
  privateParams: {
    headers?: Record<string, string>;
    body?: Record<string, any>;
  };
  environmentVariables: Record<string, string>;
  prompt: string;
  hyperstitionLink: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArbitrationSchema = new Schema<IArbitration>(
  {
    name: { type: String, required: true },
    apiUrl: { type: String, required: true },
    zkFetchMethod: { type: String, enum: ['GET', 'POST'], required: true },
    publicParams: {
      headers: { type: Map, of: String },
      body: { type: Schema.Types.Mixed },
    },
    privateParams: {
      headers: { type: Map, of: String },
      body: { type: Schema.Types.Mixed },
    },
    environmentVariables: { type: Map, of: String, required: true },
    prompt: { type: String, required: true },
    hyperstitionLink: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Arbitration: Model<IArbitration> =
  mongoose.models.Arbitration || mongoose.model<IArbitration>('Arbitration', ArbitrationSchema);

export default Arbitration;
