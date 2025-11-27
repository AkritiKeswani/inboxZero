import { google } from "googleapis";
import { CalendarAvailability } from "@/types";
import { getAuthClient } from "./gmail";
import { format, addDays, parseISO, isAfter, isBefore, nextFriday, nextMonday, isMonday, addWeeks, getDay } from "date-fns";

export async function getCalendarClient(accessToken: string) {
  const oauth2Client = getAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function checkAvailability(
  accessToken: string,
  date: string,
  startTime: string = "09:00",
  endTime: string = "17:00"
): Promise<CalendarAvailability> {
  const calendar = await getCalendarClient(accessToken);

  const startOfDay = parseISO(`${date}T00:00:00`);
  const endOfDay = parseISO(`${date}T23:59:59`);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items || [];
  const busySlots = events
    .filter((event) => event.start?.dateTime)
    .map((event) => ({
      start: event.start!.dateTime!,
      end: event.end!.dateTime || event.start!.dateTime!,
    }));

  // Find available slots
  const availableSlots: { start: string; end: string }[] = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let currentTime = new Date(startOfDay);
  currentTime.setHours(startHour, startMinute, 0, 0);

  const dayEnd = new Date(startOfDay);
  dayEnd.setHours(endHour, endMinute, 0, 0);

  for (const busySlot of busySlots) {
    const busyStart = parseISO(busySlot.start);
    const busyEnd = parseISO(busySlot.end);

    // If there's a gap before this busy slot, add it as available
    if (isAfter(busyStart, currentTime)) {
      availableSlots.push({
        start: currentTime.toISOString(),
        end: busyStart.toISOString(),
      });
    }

    // Move current time to end of busy slot
    if (isAfter(busyEnd, currentTime)) {
      currentTime = busyEnd;
    }
  }

  // Add remaining time after last busy slot
  if (isBefore(currentTime, dayEnd)) {
    availableSlots.push({
      start: currentTime.toISOString(),
      end: dayEnd.toISOString(),
    });
  }

  return {
    date,
    availableSlots: availableSlots.filter(
      (slot) =>
        new Date(slot.end).getTime() - new Date(slot.start).getTime() >=
        30 * 60 * 1000
    ), // At least 30 minutes
  };
}

export async function getAvailableDates(
  accessToken: string,
  requestedDates: string[],
  startTime: string = "09:00",
  endTime: string = "17:00"
): Promise<CalendarAvailability[]> {
  const availabilities: CalendarAvailability[] = [];

  // Limit to first 3 dates to avoid too many API calls
  const datesToCheck = requestedDates.slice(0, 3);

  for (let i = 0; i < datesToCheck.length; i++) {
    const date = datesToCheck[i];
    
    // Add delay between calendar API calls
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    try {
      const availability = await checkAvailability(
        accessToken,
        date,
        startTime,
        endTime
      );
      if (availability.availableSlots.length > 0) {
        availabilities.push(availability);
      }
    } catch (error) {
      console.error(`Error checking availability for ${date}:`, error);
      // Continue with next date instead of failing completely
      continue;
    }
  }

  return availabilities;
}

/**
 * Parse time constraint string (e.g., "Friday afternoon", "next week") and return date range
 */
export function parseTimeConstraint(constraint: string): { dates: string[]; timeRange?: { start: string; end: string } } {
  const now = new Date();
  const constraintLower = constraint.toLowerCase();
  const dates: string[] = [];
  let timeRange: { start: string; end: string } | undefined;

  // Handle "afternoon" (12:00-17:00), "morning" (09:00-12:00), "evening" (17:00-20:00)
  if (constraintLower.includes("afternoon")) {
    timeRange = { start: "12:00", end: "17:00" };
  } else if (constraintLower.includes("morning")) {
    timeRange = { start: "09:00", end: "12:00" };
  } else if (constraintLower.includes("evening")) {
    timeRange = { start: "17:00", end: "20:00" };
  }

  // Handle "Friday", "next Friday", "this Friday"
  if (constraintLower.includes("friday")) {
    if (constraintLower.includes("next")) {
      dates.push(format(nextFriday(addWeeks(now, 1)), "yyyy-MM-dd"));
    } else {
      dates.push(format(nextFriday(now), "yyyy-MM-dd"));
    }
  } else if (constraintLower.includes("monday")) {
    if (constraintLower.includes("next")) {
      dates.push(format(nextMonday(addWeeks(now, 1)), "yyyy-MM-dd"));
    } else {
      dates.push(format(nextMonday(now), "yyyy-MM-dd"));
    }
  } else if (constraintLower.includes("next week")) {
    // Add next week's weekdays
    const nextWeekStart = addWeeks(nextMonday(now), 1);
    for (let i = 0; i < 5; i++) {
      dates.push(format(addDays(nextWeekStart, i), "yyyy-MM-dd"));
    }
  } else if (constraintLower.includes("this week")) {
    // Add this week's remaining weekdays
    const thisWeekStart = isMonday(now) ? now : nextMonday(now);
    for (let i = 0; i < 5; i++) {
      const date = addDays(thisWeekStart, i);
      if (isAfter(date, now) || format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")) {
        dates.push(format(date, "yyyy-MM-dd"));
      }
    }
  }

  // If no specific date found, default to next 5 weekdays
  if (dates.length === 0) {
    let current = new Date(now);
    let added = 0;
    while (added < 5) {
      current = addDays(current, 1);
      const day = getDay(current);
      if (day >= 1 && day <= 5) { // Monday to Friday
        dates.push(format(current, "yyyy-MM-dd"));
        added++;
      }
    }
  }

  return { dates: dates.slice(0, 5), timeRange };
}

/**
 * Check availability for a time constraint (e.g., "Friday afternoon")
 * Returns available time slots that match the constraint
 */
export async function checkAvailabilityForConstraint(
  accessToken: string,
  timeConstraint: string,
  duration?: string
): Promise<CalendarAvailability[]> {
  const { dates, timeRange } = parseTimeConstraint(timeConstraint);
  
  // Parse duration (e.g., "30min" -> 30, "1 hour" -> 60)
  let requiredMinutes = 30; // Default
  if (duration) {
    const durationLower = duration.toLowerCase();
    if (durationLower.includes("hour")) {
      const hours = parseInt(durationLower.match(/\d+/)?.[0] || "1");
      requiredMinutes = hours * 60;
    } else if (durationLower.includes("min")) {
      requiredMinutes = parseInt(durationLower.match(/\d+/)?.[0] || "30");
    }
  }

  const availabilities: CalendarAvailability[] = [];

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    
    // Add delay between calendar API calls
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    try {
      const startTime = timeRange?.start || "09:00";
      const endTime = timeRange?.end || "17:00";
      
      const availability = await checkAvailability(
        accessToken,
        date,
        startTime,
        endTime
      );
      
      // Filter slots to ensure they meet duration requirement
      const validSlots = availability.availableSlots.filter(
        (slot) => {
          const slotDuration = (new Date(slot.end).getTime() - new Date(slot.start).getTime()) / (1000 * 60);
          return slotDuration >= requiredMinutes;
        }
      );

      if (validSlots.length > 0) {
        availabilities.push({
          date,
          availableSlots: validSlots,
        });
      }
    } catch (error) {
      console.error(`Error checking availability for ${date}:`, error);
      continue;
    }
  }

  return availabilities;
}

/**
 * Get suggested time slots formatted for user response
 */
export function formatTimeSlots(availabilities: CalendarAvailability[], maxSlots: number = 3): string[] {
  const slots: string[] = [];
  
  for (const availability of availabilities) {
    for (const slot of availability.availableSlots.slice(0, maxSlots)) {
      const start = parseISO(slot.start);
      const end = parseISO(slot.end);
      
      // Format as "Friday 2:00pm-2:30pm PT"
      const dayName = format(start, "EEEE");
      const startTime = format(start, "h:mma");
      const endTime = format(end, "h:mma");
      
      slots.push(`${dayName} ${startTime}-${endTime}`);
      
      if (slots.length >= maxSlots) break;
    }
    if (slots.length >= maxSlots) break;
  }
  
  return slots;
}

