import { createEmptyPlannerData, hydratePlannerData } from './planUtils'
import samplePlan from './samplePlan'
import type { GuestSeatInfo } from './viewModels'
import type { PlannerData } from './types'

export const STORAGE_KEY = 'plan-de-table-v1'

export function loadInitialPlannerData() {
  if (typeof window === 'undefined') {
    return samplePlan
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return samplePlan
  }

  try {
    return hydratePlannerData(JSON.parse(rawValue))
  } catch {
    return samplePlan
  }
}

export function sanitizeFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function getStatusTone(score: number, hardConflicts: number) {
  if (hardConflicts > 0) {
    return 'warning'
  }

  if (score >= 220) {
    return 'great'
  }

  if (score >= 80) {
    return 'good'
  }

  return 'neutral'
}

export function getStatusCopy(
  score: number,
  hardConflicts: number,
  unseatedGuests: number,
) {
  if (hardConflicts > 0) {
    return `${hardConflicts} hard conflict${hardConflicts > 1 ? 's' : ''} detected. Guests with a strong avoid score still share a table.`
  }

  if (unseatedGuests > 0) {
    return `${unseatedGuests} guest${unseatedGuests > 1 ? 's remain' : ' remains'} unseated. Seat them manually or let the optimizer finish the job.`
  }

  if (score >= 220) {
    return 'This plan looks strong: couples are close, obvious clashes are avoided, and tables have good affinity balance.'
  }

  if (score >= 80) {
    return 'The plan is workable and there are no hard conflicts. A quick auto-seat pass may still tighten a few placements.'
  }

  return 'You have a valid base plan. Add relationship scores and partner links to improve suggestions.'
}

export function buildGuestSeatLookup(planner: PlannerData) {
  const tableMap = new Map(planner.tables.map((table) => [table.id, table]))
  const roomMap = new Map(planner.rooms.map((room) => [room.id, room]))
  const lookup = new Map<string, GuestSeatInfo>()

  for (const [tableId, seats] of Object.entries(planner.seating)) {
    const table = tableMap.get(tableId)
    if (!table) {
      continue
    }

    const room = roomMap.get(table.roomId)
    for (let seatIndex = 0; seatIndex < seats.length; seatIndex += 1) {
      const guestId = seats[seatIndex]
      if (!guestId) {
        continue
      }

      lookup.set(guestId, {
        tableId,
        tableName: table.name,
        roomName: room?.name ?? 'Unknown room',
        seatIndex,
      })
    }
  }

  return lookup
}

export function createEmptySeating(planner: PlannerData) {
  return Object.fromEntries(
    planner.tables.map((table) => [table.id, Array(table.seatCount).fill(null)]),
  )
}

export function setGuestPartner(
  planner: PlannerData,
  guestId: string,
  partnerId: string | null,
) {
  return {
    ...planner,
    guests: planner.guests.map((guest) => {
      if (guest.id === guestId) {
        return {
          ...guest,
          partnerId,
        }
      }

      if (guest.id === partnerId) {
        return {
          ...guest,
          partnerId: guestId,
        }
      }

      if (guest.partnerId === guestId && guest.id !== partnerId) {
        return {
          ...guest,
          partnerId: null,
        }
      }

      if (partnerId && guest.partnerId === partnerId && guest.id !== guestId) {
        return {
          ...guest,
          partnerId: null,
        }
      }

      return guest
    }),
  }
}

export function freshPlanner() {
  return createEmptyPlannerData()
}
