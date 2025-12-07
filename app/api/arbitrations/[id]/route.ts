import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Arbitration from '@/models/Arbitration';
import Session from '@/models/Session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const arbitration = await Arbitration.findById(id);
    const sessions = await Session.find({ arbitrationId: id }).sort({ createdAt: -1 }).limit(50);
    console.log("Fetched arbitration with sessions:", arbitration, sessions);
    if (!arbitration) {
      return NextResponse.json(
        { error: 'Arbitration not found' },
        { status: 404 }
      );
    }
    const arbitrationObj = arbitration.toObject({ flattenMaps: true });

    // Redact private parameter values
    if (arbitrationObj.privateParams?.headers) {
      arbitrationObj.privateParams.headers = Object.fromEntries(
        Object.keys(arbitrationObj.privateParams.headers).map(key => [key, '***'])
      );
    }
    if (arbitrationObj.privateParams?.body && typeof arbitrationObj.privateParams.body === 'object') {
      arbitrationObj.privateParams.body = Object.fromEntries(
        Object.keys(arbitrationObj.privateParams.body).map(key => [key, '***'])
      );
    }

    console.log("returning", {...arbitrationObj, sessions})
    return NextResponse.json({...arbitrationObj, sessions});
  } catch (error) {
    console.error('Error fetching arbitration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arbitration' },
      { status: 500 }
    );
  }
}
