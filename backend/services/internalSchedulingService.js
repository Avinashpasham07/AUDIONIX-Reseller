const MeetingRequest = require('../models/MeetingRequest');
const Settings = require('../models/Settings');

exports.getAvailableSlots = async (dateStr) => {
    // 1. Fetch working hours from settings (default 9-5)
    // ADMIN SETTINGS are assumed to be in IST
    const startSetting = await Settings.findOne({ key: 'work_start' });
    const endSetting = await Settings.findOne({ key: 'work_end' });

    const startTimeStr = startSetting ? startSetting.value : '09:00';
    const endTimeStr = endSetting ? endSetting.value : '17:00';

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    // 2. Define working hours for the specific date
    // We construct these dates treating them as "Abstract Time" (matching Admin's IST intent)
    // Date parsing 'YYYY-MM-DD' usually parses as UTC midnight
    const [year, month, day] = dateStr.split('-').map(Number);

    const slotCursor = new Date(Date.UTC(year, month - 1, day, startH, startM, 0));
    const dayEndLimit = new Date(Date.UTC(year, month - 1, day, endH, endM, 0));

    // 3. Fetch existing meetings (Stored as ISO Strings)
    // We search for meetings that overlap with this Day's range in UTC
    const searchStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const searchEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

    const existingMeetings = await MeetingRequest.find({
        preferredDate: { $gte: searchStart, $lte: searchEnd },
        status: { $in: ['pending', 'scheduled'] }
    });

    // 4. Calculate "Current Time" in IST to filter out past slots
    // Create a Date object representing "Now" in IST
    const nowUTC = new Date();
    // Offset UTC to IST (+5.5 hours)
    const nowIST = new Date(nowUTC.getTime() + (5.5 * 60 * 60 * 1000));
    const currentHourIST = nowIST.getUTCHours();
    const currentMinuteIST = nowIST.getUTCMinutes();

    // We need 'nowIST' to be comparable to 'slotCursor' (which is Year-Month-Day Hour:Min in UTC-representation-of-IST)
    // So we effectively shift "Now" to align with the "Abstract IST" of slotCursor
    // Actually, since slotCursor is created with Date.UTC(...), it effectively IS the time at Greenwich.
    // If we want it to represent IST, we just compare it vs "Now shifted to IST".
    // Example: Slot is 09:00. slotCursor is 09:00 UTC.
    // Real Time is 04:00 UTC (09:30 IST).
    // nowIST calculated above will be 09:30 (epoch shifted).
    // Comparing 09:00 < 09:30 works!

    const slots = [];

    while (slotCursor < dayEndLimit) {
        const slotStart = new Date(slotCursor);
        const slotEnd = new Date(slotCursor.getTime() + 30 * 60000); // +30 mins

        // A. Past Time Check (Strict IST)
        let isBusy = false;

        // Only check "Past" if the requested date is Today (IST)
        // Check if dateStr matches today's IST date
        const todayISTStr = nowIST.toISOString().split('T')[0];

        if (dateStr === todayISTStr) {
            if (slotStart < nowIST) {
                isBusy = true;
            }
        } else if (dateStr < todayISTStr) {
            // Entire day is in the past
            isBusy = true;
        }

        // B. Overlap Check
        if (!isBusy) {
            const isOverlap = existingMeetings.some(meet => {
                const mStart = new Date(meet.preferredDate);
                const mEnd = new Date(mStart.getTime() + 30 * 60000);
                return (slotStart < mEnd && slotEnd > mStart);
            });
            if (isOverlap) isBusy = true;
        }

        if (!isBusy) {
            // Format Label (HH:MM UTC because we stuffed IST time into UTC slots)
            const label = slotStart.toLocaleTimeString('en-US', {
                timeZone: 'UTC',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
                label: label
            });
        }

        // Increment by 30 mins
        slotCursor.setMinutes(slotCursor.getMinutes() + 30);
    }

    return slots;
};
