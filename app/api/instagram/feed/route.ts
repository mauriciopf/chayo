import { NextResponse } from 'next/server';
import { getInstagramClient } from '@/lib/instagram/client';

export const dynamic = 'force-dynamic'; // Disable static optimization for API routes

export async function GET(request: Request) {
  try {
    // Get account ID from environment
    const accountId = process.env.NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Instagram Business Account ID is not configured' },
        { status: 500 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    // Fetch Instagram media
    const client = getInstagramClient();
    const data = await client.fetchUserMedia(accountId, limit);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Instagram API error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch Instagram feed',
      },
      { status: 500 }
    );
  }
}
