import { google } from "googleapis";
import { CalendarAvailability } from "@/types";
import { getAuthClient } from "./gmail";
import { format, addDays, parseISO, isAfter, isBefore } from "date-fns";

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

  for (const date of requestedDates) {
    const availability = await checkAvailability(
      accessToken,
      date,
      startTime,
      endTime
    );
    if (availability.availableSlots.length > 0) {
      availabilities.push(availability);
    }
  }

  return availabilities;
}

