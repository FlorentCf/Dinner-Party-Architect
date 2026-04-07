import type { Guest } from './types'

export function formatGuestLabel(guest: Guest) {
  return guest.importId ? `${guest.name} (ID ${guest.importId})` : guest.name
}
