import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pollId = searchParams.get('pollId');

    if (!pollId) {
      return new Response('Poll ID is required', { status: 400 });
    }

    const convexUrl = process.env.VITE_CONVEX_URL || 'https://youthful-lark-845.convex.cloud';
    const response = await fetch(`${convexUrl}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'polls:get',
        args: { pollId },
        format: 'json',
      }),
    });

    if (!response.ok) {
      return new Response('Failed to fetch poll', { status: 500 });
    }

    const data = await response.json();
    const poll = data.value;

    if (!poll) {
      return new Response('Poll not found', { status: 404 });
    }

    const title = poll.title || 'Polymart Poll';
    const outcomes = poll.outcomes || [];
    const totalVolume = poll.totalVolume || 0;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#0a0a0a',
            color: '#fff',
            fontFamily: 'monospace',
            padding: '60px',
          }}
        >
          <div style={{ display: 'flex', fontSize: '24px', color: '#888', marginBottom: '20px' }}>
            Polymart
          </div>
          <div style={{ display: 'flex', fontSize: '56px', fontWeight: 'bold', marginBottom: '40px', lineHeight: 1.2 }}>
            {title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'auto' }}>
            {outcomes.slice(0, 3).map((outcome: any, i: number) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '28px' }}>
                  <span>{outcome.title}</span>
                  <span style={{ color: '#60a5fa' }}>{outcome.probability?.toFixed(0)}%</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    height: '8px',
                    backgroundColor: '#1f1f1f',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${outcome.probability}%`,
                      backgroundColor: '#60a5fa',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', fontSize: '24px', color: '#666', marginTop: '40px' }}>
            {totalVolume.toLocaleString()} pts total volume
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
