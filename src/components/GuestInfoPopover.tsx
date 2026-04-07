import { formatCircleString, formatTagString } from '../planUtils'
import { formatGuestLabel } from '../guestDisplay'
import type { Guest, PlannerData } from '../types'

function findGuestSeat(planner: PlannerData, guestId: string) {
  const tablesById = new Map(planner.tables.map((table) => [table.id, table]))
  const roomsById = new Map(planner.rooms.map((room) => [room.id, room]))

  for (const [tableId, seats] of Object.entries(planner.seating)) {
    const seatIndex = seats.findIndex((seatGuestId) => seatGuestId === guestId)
    const table = tablesById.get(tableId)

    if (seatIndex >= 0 && table) {
      return {
        roomName: roomsById.get(table.roomId)?.name ?? 'Unknown room',
        tableName: table.name,
        seatNumber: seatIndex + 1,
      }
    }
  }

  return null
}

function getDisplayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? 'Not set' : value
}

function GuestInfoPopover({
  guest,
  planner,
  className = '',
}: {
  guest: Guest
  planner: PlannerData
  className?: string
}) {
  const partner = guest.partnerId
    ? planner.guests.find((currentGuest) => currentGuest.id === guest.partnerId)
    : null
  const fixedTable = guest.lockedTableId
    ? planner.tables.find((table) => table.id === guest.lockedTableId)
    : null
  const seat = findGuestSeat(planner, guest.id)

  return (
    <details className={`guest-info ${className}`.trim()}>
      <summary>{formatGuestLabel(guest)}</summary>
      <div className="guest-info-card">
        <strong>{formatGuestLabel(guest)}</strong>
        <dl>
          <div>
            <dt>Seat</dt>
            <dd>
              {seat
                ? `${seat.roomName} / ${seat.tableName} / Seat ${seat.seatNumber}`
                : 'Unseated'}
            </dd>
          </div>
          <div>
            <dt>Partner</dt>
            <dd>{partner ? formatGuestLabel(partner) : 'No partner'}</dd>
          </div>
          <div>
            <dt>Fixed table</dt>
            <dd>{fixedTable?.name ?? 'No fixed table'}</dd>
          </div>
          <div>
            <dt>Age</dt>
            <dd>{getDisplayValue(guest.age)}</dd>
          </div>
          <div>
            <dt>Circles</dt>
            <dd>
              {guest.circles.length
                ? formatCircleString(guest.circles)
                : 'No circles'}
            </dd>
          </div>
          <div>
            <dt>Tags</dt>
            <dd>{guest.tags.length ? formatTagString(guest.tags) : 'No tags'}</dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd>{getDisplayValue(guest.notes)}</dd>
          </div>
        </dl>
      </div>
    </details>
  )
}

export default GuestInfoPopover
