import type { DragEvent } from 'react'
import type { Guest, PlannerData, Table } from '../types'

type VisualPlanPanelProps = {
  planner: PlannerData
  guestsById: Map<string, Guest>
  unseatedGuests: Guest[]
  onMoveGuest: (guestId: string, tableId: string, seatIndex: number) => void
  onUnseatGuest: (guestId: string) => void
}

function getSeatPosition(table: Table, seatIndex: number, seatCount: number) {
  const angle = (seatIndex / seatCount) * Math.PI * 2 - Math.PI / 2
  const radiusX = table.shape === 'rectangle' ? 40 : 42
  const radiusY = table.shape === 'rectangle' ? 33 : table.shape === 'oval' ? 37 : 42

  return {
    left: `${50 + Math.cos(angle) * radiusX}%`,
    top: `${50 + Math.sin(angle) * radiusY}%`,
  }
}

function readDraggedGuestId(event: DragEvent) {
  return event.dataTransfer.getData('text/plain')
}

function VisualPlanPanel({
  planner,
  guestsById,
  unseatedGuests,
  onMoveGuest,
  onUnseatGuest,
}: VisualPlanPanelProps) {
  function handleDragStart(event: DragEvent, guestId: string) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', guestId)
  }

  function handleSeatDrop(
    event: DragEvent,
    tableId: string,
    seatIndex: number,
  ) {
    event.preventDefault()
    const guestId = readDraggedGuestId(event)

    if (guestId) {
      onMoveGuest(guestId, tableId, seatIndex)
    }
  }

  function handleUnseatDrop(event: DragEvent) {
    event.preventDefault()
    const guestId = readDraggedGuestId(event)

    if (guestId) {
      onUnseatGuest(guestId)
    }
  }

  return (
    <section className="panel panel-wide visual-panel">
      <div className="section-heading visual-heading">
        <div>
          <span className="section-kicker">Visual plan</span>
          <h2>Drag guests directly around the room.</h2>
        </div>
        <p>
          Drag a guest chip onto a seat to move them. Drop onto an occupied seat
          to swap places, or drop into the unseat tray to remove them from a table.
        </p>
      </div>

      <div
        className="unseat-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleUnseatDrop}
      >
        <strong>Unseat drop zone</strong>
        <span>Drop any seated guest here to leave them unassigned.</span>
      </div>

      <div className="visual-layout">
        {planner.rooms.map((room) => {
          const roomTables = planner.tables.filter((table) => table.roomId === room.id)

          return (
            <article className="visual-room" key={room.id}>
              <div className="visual-room-header">
                <div>
                  <span>{room.name}</span>
                  <strong>{roomTables.length} table{roomTables.length === 1 ? '' : 's'}</strong>
                </div>
                {room.notes ? <p>{room.notes}</p> : null}
              </div>

              <div className="visual-tables">
                {roomTables.length === 0 ? (
                  <div className="empty-card">No tables in this room yet.</div>
                ) : (
                  roomTables.map((table) => {
                    const seats = planner.seating[table.id] ?? Array(table.seatCount).fill(null)

                    return (
                      <section className={`visual-table ${table.shape}`} key={table.id}>
                        <div className="visual-table-map">
                          <div className="visual-table-core">
                            <strong>{table.name}</strong>
                            <span>{table.seatCount} seats</span>
                          </div>

                          {seats.map((guestId, seatIndex) => {
                            const guest = guestId ? guestsById.get(guestId) : null
                            const position = getSeatPosition(table, seatIndex, seats.length)

                            return (
                              <button
                                className={`visual-seat${guest ? ' occupied' : ''}`}
                                draggable={Boolean(guest)}
                                key={`${table.id}-${seatIndex}`}
                                style={position}
                                title={
                                  guest
                                    ? `${guest.name} at ${table.name}, seat ${seatIndex + 1}`
                                    : `Empty seat ${seatIndex + 1} at ${table.name}`
                                }
                                onDragStart={(event) => {
                                  if (guest) {
                                    handleDragStart(event, guest.id)
                                  }
                                }}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => handleSeatDrop(event, table.id, seatIndex)}
                              >
                                <span>Seat {seatIndex + 1}</span>
                                <strong>{guest?.name ?? 'Empty'}</strong>
                              </button>
                            )
                          })}
                        </div>
                        {table.notes ? <p className="visual-table-note">{table.notes}</p> : null}
                      </section>
                    )
                  })
                )}
              </div>
            </article>
          )
        })}
      </div>

      <aside className="floating-unseated-panel">
        <div>
          <span className="section-kicker">Unseated</span>
          <strong>{unseatedGuests.length} guest{unseatedGuests.length === 1 ? '' : 's'}</strong>
        </div>
        <div className="floating-unseated-list">
          {unseatedGuests.length === 0 ? (
            <span className="guest-chip quiet">Everyone is seated</span>
          ) : (
            unseatedGuests.map((guest) => (
              <button
                className="guest-drag-chip"
                draggable
                key={guest.id}
                onDragStart={(event) => handleDragStart(event, guest.id)}
              >
                {guest.name}
              </button>
            ))
          )}
        </div>
      </aside>
    </section>
  )
}

export default VisualPlanPanel
