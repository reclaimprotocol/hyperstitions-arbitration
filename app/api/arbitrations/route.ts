import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Arbitration from '@/models/Arbitration';

export async function GET() {
  try {
    await dbConnect();
    const arbitrations = await Arbitration.find({}).sort({ createdAt: -1 });
    return NextResponse.json(arbitrations);
  } catch (error) {
    console.error('Error fetching arbitrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arbitrations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const arbitration = await Arbitration.create(body);
    return NextResponse.json(arbitration, { status: 201 });
  } catch (error) {
    console.error('Error creating arbitration:', error);
    return NextResponse.json(
      { error: 'Failed to create arbitration' },
      { status: 500 }
    );
  }
}
