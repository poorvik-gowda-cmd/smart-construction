import { NextResponse } from 'next/server';
import { analyzeProjectRisk } from '@/lib/openai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.attendanceTrend || !data.materialStatus || !data.budgetStatus || typeof data.progressPercent !== 'number') {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    const result = await analyzeProjectRisk(data);

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
