import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User, HabitState } from '@/lib/models';
import { generateToken } from '@/lib/auth';
import { MAX_USERNAME_LENGTH, MDP_INITIAL_STRENGTH } from '@/constants';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => ({}));
    const { username, email, action } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    if (username.length > MAX_USERNAME_LENGTH) {
      return NextResponse.json({ error: `Username must be ${MAX_USERNAME_LENGTH} characters or fewer` }, { status: 400 });
    }

    let user = await User.findOne({ username });

    if (action === 'register') {
      if (user) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }
      user = new User({
        username,
        email: email || `${username}@example.com`,
        password: 'mock_password_hash',
      });
      await user.save();

      // Initialize Habit State for the new user
      const habitState = new HabitState({
        userId: user._id,
        habitStrength: MDP_INITIAL_STRENGTH,
        lastLoggedAt: new Date(),
        history: [],
      });
      await habitState.save();
    } else {
      // Login (for convenience in this MVP, we auto-create if they don't exist)
      if (!user) {
        user = new User({
          username,
          email: email || `${username}@example.com`,
          password: 'mock_password_hash',
        });
        await user.save();

        const habitState = new HabitState({
          userId: user._id,
          habitStrength: MDP_INITIAL_STRENGTH,
          lastLoggedAt: new Date(),
          history: [],
        });
        await habitState.save();
      }
    }

    const token = generateToken({ id: user._id.toString(), username: user.username });

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email
      }
    });
  } catch (error: unknown) {
    console.error('Auth API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
