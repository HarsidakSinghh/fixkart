import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

// Admin emails that can access the mobile app
const ADMIN_EMAILS = ['jka8685@gmail.com', 'info@thefixkart.com', 'sidak798@gmail.com'];

/**
 * Verify admin status for mobile users
 * POST /api/mobile/auth/verify-admin
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const isAdmin = ADMIN_EMAILS.includes(email);

    if (!isAdmin) {
      return NextResponse.json(
        { 
          isAdmin: false, 
          error: 'Access denied. You do not have admin privileges.' 
        },
        { status: 403 }
      );
    }

    const client = await clerkClient();

    try {
      const users = await client.users.getUserList({
        emailAddress: [email],
        limit: 1,
      });

      if (users.length === 0) {
        return NextResponse.json(
          { 
            isAdmin: true, 
            message: 'Admin verified but user not found in Clerk',
            userExists: false 
          },
          { status: 200 }
        );
      }

      const user = users[0];

      return NextResponse.json({
        isAdmin: true,
        userExists: true,
        user: {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        },
      });
    } catch (clerkError) {
      console.error('Clerk error:', clerkError);
      return NextResponse.json({
        isAdmin: true,
        userExists: false,
        message: 'Admin verified (Clerk lookup skipped)',
      });
    }
  } catch (error) {
    console.error('Verify admin error:', error);
    return NextResponse.json(
      { error: 'Failed to verify admin status' },
      { status: 500 }
    );
  }
}
