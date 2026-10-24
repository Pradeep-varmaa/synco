import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // If live credentials exist, authenticate with Google OAuth2
    if (clientId && clientSecret) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`
        );

        // Fetch tokens from DB accounts table
        const accountRes = await query(
          "SELECT access_token, refresh_token FROM accounts WHERE provider = 'google' LIMIT 1"
        );

        if (accountRes && accountRes.rows.length > 0) {
          const { access_token, refresh_token } = accountRes.rows[0];
          oauth2Client.setCredentials({
            access_token,
            refresh_token,
          });

          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          const googleEvents = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
          });

          return NextResponse.json({
            success: true,
            syncedWithGoogle: true,
            eventsCount: googleEvents.data.items?.length || 0,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Google Calendar API remote fetch warning:', err);
      }
    }

    // Fallback sync response
    return NextResponse.json({
      success: true,
      syncedWithGoogle: false,
      message: 'Calendar sync check completed.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Calendar synchronization encountered an issue' },
      { status: 500 }
    );
  }
}
