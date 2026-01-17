const { google } = require('googleapis');
const Settings = require('../models/Settings');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Helper to get authorized client
const getAuthorizedClient = async () => {
    const googleTokens = await Settings.findOne({ key: 'google_calendar_tokens' });
    if (!googleTokens) return null;

    oauth2Client.setCredentials(googleTokens.value);

    // Check if access token is expired and refresh it
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
            // New refresh token received, save it
            await Settings.findOneAndUpdate(
                { key: 'google_calendar_tokens' },
                { value: { ...googleTokens.value, ...tokens } },
                { upsert: true }
            );
        } else {
            // Only update access token
            await Settings.findOneAndUpdate(
                { key: 'google_calendar_tokens' },
                { value: { ...googleTokens.value, ...tokens } }
            );
        }
    });

    return oauth2Client;
};

exports.getAuthUrl = () => {
    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly'
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent' // Forces refresh token
    });
};

exports.saveTokens = async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    await Settings.findOneAndUpdate(
        { key: 'google_calendar_tokens' },
        {
            value: tokens,
            description: 'Google Calendar API Tokens'
        },
        { upsert: true }
    );
    return tokens;
};

exports.getAvailableSlots = async (date) => {
    const auth = await getAuthorizedClient();
    if (!auth) throw new Error('Google Calendar not linked');

    const calendar = google.calendar({ version: 'v3', auth });

    // Define working hours: 9 AM to 5 PM
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(17, 0, 0, 0);

    // Query freebusy
    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            items: [{ id: 'primary' }]
        }
    });

    const busySlots = response.data.calendars.primary.busy;

    // Generate 30-minute slots
    const slots = [];
    let current = new Date(startOfDay);

    while (current < endOfDay) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + 30 * 60000);

        // Check if slot overlaps with any busy period
        const isBusy = busySlots.some(busy => {
            const bStart = new Date(busy.start);
            const bEnd = new Date(busy.end);
            return (slotStart < bEnd && slotEnd > bStart);
        });

        if (!isBusy) {
            slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
                label: slotStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
        }

        current = slotEnd;
    }

    return slots;
};

exports.createMeeting = async (meetingData) => {
    const auth = await getAuthorizedClient();
    if (!auth) throw new Error('Google Calendar not linked');

    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
        summary: `Support Call: ${meetingData.topic}`,
        description: `Description: ${meetingData.description}\n\nClient: ${meetingData.clientName}\nPhone: ${meetingData.clientPhone}`,
        start: {
            dateTime: meetingData.startTime,
            timeZone: 'Asia/Kolkata',
        },
        end: {
            dateTime: meetingData.endTime,
            timeZone: 'Asia/Kolkata',
        },
        conferenceData: {
            createRequest: {
                requestId: `support_${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
        },
        attendees: [
            { email: meetingData.clientEmail }
        ]
    };

    const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all'
    });

    return response.data;
};
