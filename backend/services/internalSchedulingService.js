const MeetingRequest = require('../models/MeetingRequest');
const Settings = require('../models/Settings');

exports.getAvailableSlots = async (dateStr) => {
    // 1. Fetch working hours from settings (default 9-5)
    const startSetting = await Settings.findOne({ key: 'work_start' });
    const endSetting = await Settings.findOne({ key: 'work_end' });

    const startTimeStr = startSetting ? startSetting.value : '09:00';
    const endTimeStr = endSetting ? endSetting.value : '17:00';

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    // 2. Define working hours for the specific date (Explicit Local Time)
    const [year, month, day] = dateStr.split('-').map(Number);

    const startDate = new Date(year, month - 1, day);
    startDate.setHours(startH, startM, 0, 0);

    const endDate = new Date(year, month - 1, day);
    endDate.setHours(endH, endM, 0, 0);

    // 3. Fetch all existing "scheduled" or "pending" meetings for this date
    const dayStart = new Date(year, month - 1, day);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(year, month - 1, day);
    dayEnd.setHours(23, 59, 59, 999);

    console.log(`[DEBUG] Fetching slots for: ${dateStr}`);
    console.log(`[DEBUG] dayStart: ${dayStart.toISOString()} (Local: ${dayStart.toString()})`);
    console.log(`[DEBUG] dayEnd: ${dayEnd.toISOString()} (Local: ${dayEnd.toString()})`);

    const existingMeetings = await MeetingRequest.find({
        preferredDate: { $gte: dayStart, $lte: dayEnd },
        status: { $in: ['pending', 'scheduled'] }
    });

    console.log(`[DEBUG] Found ${existingMeetings.length} existing meetings`);
    existingMeetings.forEach(m => console.log(`[DEBUG] Existing: ${m.preferredDate.toISOString()} (${m.status})`));

    // 4. Generate 30-minute slots
    const slots = [];
    let current = new Date(startDate);

    while (current < endDate) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + 30 * 60000);

        // Check for collision with existing meetings
        // We assume preferredDate is the EXACT start time for internal bookings
        let isBusy = existingMeetings.some(meet => {
            const mStart = new Date(meet.preferredDate);
            const mEnd = new Date(mStart.getTime() + 30 * 60000);

            // Overlap logic: (StartA < EndB) and (EndA > StartB)
            // Debug overlap check
            const overlap = (slotStart < mEnd && slotEnd > mStart);
            if (overlap) {
                console.log(`[DEBUG] Collision detected! Slot: ${slotStart.toISOString()} overlaps with Meeting: ${mStart.toISOString()}`);
            }
            return overlap;
        });

        // 5. Also check if slot is in the past (for today)
        if (slotStart < new Date()) {
            isBusy = true;
        }

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
