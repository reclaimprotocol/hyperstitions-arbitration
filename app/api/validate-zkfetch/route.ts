import { NextResponse } from 'next/server';
import { ReclaimClient } from '@reclaimprotocol/zk-fetch';

export async function POST(request: Request) {
  try {
    const { method, apiUrl, publicParams, privateParams } = await request.json();

    if (!method) {
      return NextResponse.json(
        { error: 'Method is required' },
        { status: 400 }
      );
    }

    if (!apiUrl) {
      return NextResponse.json(
        { error: 'API URL is required' },
        { status: 400 }
      );
    }

    const client = new ReclaimClient(process.env.RECLAIMPROTOCOL_APP_ID || "", process.env.RECLAIMPROTOCOL_APP_SECRET || "");
    await client.zkFetch(apiUrl, { method, ...publicParams}, privateParams);

    return NextResponse.json({
      success: true,
      message: 'zkFetch configuration validated',
    });
  } catch (error: any) {
    console.error('Error validating zkFetch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate zkFetch configuration' },
      { status: 500 }
    );
  }
}
