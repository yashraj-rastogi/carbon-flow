import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CarbonLog, HabitState } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';
import { processOmissionsIfOverdue, updateHabitState } from '@/lib/mdp';

export async function GET(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const userId = authUser.userId;

    // 1. Process any overdue daily logging windows to apply omissions
    const omissionUpdate = await processOmissionsIfOverdue(userId);
    if (omissionUpdate) {
      console.log(`Applied ${omissionUpdate.appliedOmissionsCount} overdue omissions. New habit strength: ${omissionUpdate.currentStrength}`);
    }

    // 2. Fetch logs and habit state
    const [logs, habitState] = await Promise.all([
      CarbonLog.find({ userId }).sort({ createdAt: -1 }).limit(50),
      HabitState.findOne({ userId })
    ]);

    // 3. Calculate metrics for the dashboard
    let totalEmissions = 0;
    let categoryEmissions = { electricity: 0, gas: 0, water: 0, voice_log: 0, receipt: 0 };
    
    logs.forEach(log => {
      totalEmissions += log.co2EmissionsKg;
      const type = log.type as keyof typeof categoryEmissions;
      if (type in categoryEmissions) {
        categoryEmissions[type] += log.co2EmissionsKg;
      }
    });

    return NextResponse.json({
      success: true,
      logs,
      habitState: habitState || { habitStrength: 5, history: [] },
      metrics: {
        totalEmissions,
        categoryEmissions,
        logCount: logs.length
      }
    });
  } catch (error: any) {
    console.error('History API GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Support manual action override (e.g. testing an omission or adding a manual entry)
export async function POST(request: Request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json().catch(() => ({}));
    if (action !== 'omission') {
      return NextResponse.json({ error: 'Invalid manual action' }, { status: 400 });
    }

    await connectToDatabase();
    // Manually force an omission update for testing
    const mdpResult = await updateHabitState(authUser.userId, 'omission');

    return NextResponse.json({
      success: true,
      message: 'Manual omission applied successfully',
      mdp: mdpResult
    });
  } catch (error: any) {
    console.error('History API POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
