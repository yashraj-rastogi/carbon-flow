import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Action, CarbonLog } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';
import { updateHabitState } from '@/lib/mdp';

const SEED_ACTIONS = [
  {
    name: "Set Thermostat -2°",
    category: "gas",
    impactKg: -1.2,
    icon: "Flame",
    description: "Lower your thermostat by 2 degrees during winter or raise it during summer."
  },
  {
    name: "Shortened Shower",
    category: "water",
    impactKg: -0.4,
    icon: "Droplet",
    description: "Reduce shower time by 5 minutes to conserve hot water energy."
  },
  {
    name: "Unplug Idle Devices",
    category: "electricity",
    impactKg: -0.2,
    icon: "Sparkles",
    description: "Disconnect phantom loads (TV, chargers, microwave) when not in use."
  },
  {
    name: "Walk or Bike",
    category: "conservation",
    impactKg: -2.5,
    icon: "Globe",
    description: "Replace a short car trip (under 3 miles) with walking or cycling."
  },
  {
    name: "Cold Laundry Cycle",
    category: "electricity",
    impactKg: -0.8,
    icon: "Activity",
    description: "Wash laundry in cold water instead of warm/hot to save heating energy."
  }
];

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    let actions = await Action.find({});
    
    // Auto-seed if collection is empty
    if (actions.length === 0) {
      console.log('Action database empty. Seeding curated actions...');
      await Action.insertMany(SEED_ACTIONS);
      actions = await Action.find({});
    }
    
    return NextResponse.json({ success: true, actions });
  } catch (error: unknown) {
    console.error('Actions GET Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Valid token required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { actionId } = body;

    if (!actionId) {
      return NextResponse.json({ error: 'Action ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // 2. Find Action
    const action = await Action.findById(actionId);
    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // 3. Create Carbon Log
    // Since it's a manual tap action, we log it with negative footprint (CO2 savings)
    const log = new CarbonLog({
      userId: authUser.userId,
      type: action.category,
      fileName: 'Manual Action',
      rawText: action.description,
      billDetails: {
        utilityCompany: 'Self-Logged Micro-habit',
        billingPeriod: new Date().toLocaleDateString(),
        consumption: 1,
        units: 'action',
        state: 'US'
      },
      co2EmissionsKg: action.impactKg, // Negative number (e.g. -1.2) representing carbon savings
    });
    await log.save();

    // 4. Trigger MDP transition
    const mdpResult = await updateHabitState(authUser.userId, 'log', action.impactKg);

    return NextResponse.json({
      success: true,
      message: `Completed action: ${action.name}`,
      carbonDeltaKg: action.impactKg,
      mdp: mdpResult
    });

  } catch (error: unknown) {
    console.error('Actions POST Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
