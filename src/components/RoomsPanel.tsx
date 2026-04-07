import type { ChangeEvent } from 'react'
import type { Guest, PlannerData, Room, Table, TableShape } from '../types'
import type { GuestSeatInfo, RoomDraft, TableDraft } from '../viewModels'

type RoomsPanelProps = {
  planner: PlannerData
  guestsById: Map<string, Guest>
  guestSeatLookup: Map<string, GuestSeatInfo>
  unseatedGuests: Guest[]
  roomDraft: RoomDraft
  tableDraft: TableDraft
  onRoomDraftChange: (field: keyof RoomDraft, value: string) => void
  onAddRoom: () => void
  onRoomFieldChange: (roomId: string, field: keyof Room, value: string) => void
  onRemoveRoom: (roomId: string) => void
  onTableDraftChange: (field: keyof TableDraft, value: string) => void
  onAddTable: () => void
  onTableFieldChange: (tableId: string, field: keyof Table, value: string) => void
  onRemoveTable: (tableId: string) => void
  onSeatChange: (
    tableId: string,
    seatIndex: number,
    event: ChangeEvent<HTMLSelectElement>,
  ) => void
}

function formatGuestLabel(guest: Guest) {
  return guest.importId ? `${guest.name} (ID ${guest.importId})` : guest.name
}

function RoomsPanel({
  planner,
  guestsById,
  guestSeatLookup,
  unseatedGuests,
  roomDraft,
  tableDraft,
  onRoomDraftChange,
  onAddRoom,
  onRoomFieldChange,
  onRemoveRoom,
  onTableDraftChange,
  onAddTable,
  onTableFieldChange,
  onRemoveTable,
  onSeatChange,
}: RoomsPanelProps) {
  return (
    <section className="panel panel-wide">
      <div className="section-heading">
        <div>
          <span className="section-kicker">1. Rooms and tables</span>
          <h2>Place the physical layout first.</h2>
        </div>
        <p>
          Different rooms, different table sizes, and manual seat control all live
          here.
        </p>
      </div>

      <div className="editor-card">
        <div className="form-grid room-grid">
          <label className="field">
            <span>New room</span>
            <input
              value={roomDraft.name}
              onChange={(event) => onRoomDraftChange('name', event.target.value)}
              placeholder="Garden room"
            />
          </label>
          <label className="field wide">
            <span>Room notes</span>
            <input
              value={roomDraft.notes}
              onChange={(event) => onRoomDraftChange('notes', event.target.value)}
              placeholder="Quiet corner for grandparents"
            />
          </label>
          <button onClick={onAddRoom}>Add room</button>
        </div>

        <div className="form-grid table-grid">
          <label className="field">
            <span>Room</span>
            <select
              value={tableDraft.roomId || planner.rooms[0]?.id || ''}
              onChange={(event) => onTableDraftChange('roomId', event.target.value)}
            >
              {planner.rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>New table</span>
            <input
              value={tableDraft.name}
              onChange={(event) => onTableDraftChange('name', event.target.value)}
              placeholder="Friends table"
            />
          </label>
          <label className="field">
            <span>Shape</span>
            <select
              value={tableDraft.shape}
              onChange={(event) =>
                onTableDraftChange('shape', event.target.value as TableShape)
              }
            >
              <option value="round">Round</option>
              <option value="oval">Oval</option>
              <option value="rectangle">Rectangle</option>
              <option value="kids">Kids</option>
            </select>
          </label>
          <label className="field">
            <span>Seats</span>
            <input
              type="number"
              min="1"
              max="20"
              value={tableDraft.seatCount}
              onChange={(event) => onTableDraftChange('seatCount', event.target.value)}
            />
          </label>
          <label className="field wide">
            <span>Table notes</span>
            <input
              value={tableDraft.notes}
              onChange={(event) => onTableDraftChange('notes', event.target.value)}
              placeholder="Near the dance floor"
            />
          </label>
          <button onClick={onAddTable}>Add table</button>
        </div>
      </div>

      <div className="chip-row">
        <span className="chip-label">Unseated guests</span>
        {unseatedGuests.length === 0 ? (
          <span className="guest-chip quiet">Everyone is seated</span>
        ) : (
          unseatedGuests.map((guest) => (
            <span className="guest-chip" key={guest.id}>
              {guest.name}
            </span>
          ))
        )}
      </div>

      <div className="room-stack">
        {planner.rooms.map((room) => {
          const roomTables = planner.tables.filter((table) => table.roomId === room.id)

          return (
            <article className="room-card" key={room.id}>
              <div className="room-header">
                <div className="room-fields">
                  <label className="field">
                    <span>Room name</span>
                    <input
                      value={room.name}
                      onChange={(event) =>
                        onRoomFieldChange(room.id, 'name', event.target.value)
                      }
                    />
                  </label>
                  <label className="field wide">
                    <span>Notes</span>
                    <input
                      value={room.notes}
                      onChange={(event) =>
                        onRoomFieldChange(room.id, 'notes', event.target.value)
                      }
                    />
                  </label>
                </div>
                <button className="ghost danger" onClick={() => onRemoveRoom(room.id)}>
                  Remove room
                </button>
              </div>

              <div className="tables-grid">
                {roomTables.length === 0 ? (
                  <div className="empty-card">No tables in this room yet.</div>
                ) : (
                  roomTables.map((table) => {
                    const seats =
                      planner.seating[table.id] ?? Array(table.seatCount).fill(null)

                    return (
                      <section className="table-card" key={table.id}>
                        <div className="table-card-header">
                          <div className="table-fields">
                            <label className="field">
                              <span>Table name</span>
                              <input
                                value={table.name}
                                onChange={(event) =>
                                  onTableFieldChange(table.id, 'name', event.target.value)
                                }
                              />
                            </label>
                            <label className="field">
                              <span>Shape</span>
                              <select
                                value={table.shape}
                                onChange={(event) =>
                                  onTableFieldChange(table.id, 'shape', event.target.value)
                                }
                              >
                                <option value="round">Round</option>
                                <option value="oval">Oval</option>
                                <option value="rectangle">Rectangle</option>
                                <option value="kids">Kids</option>
                              </select>
                            </label>
                            <label className="field">
                              <span>Seats</span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={table.seatCount}
                                onChange={(event) =>
                                  onTableFieldChange(
                                    table.id,
                                    'seatCount',
                                    event.target.value,
                                  )
                                }
                              />
                            </label>
                          </div>
                          <button
                            className="ghost danger"
                            onClick={() => onRemoveTable(table.id)}
                          >
                            Remove table
                          </button>
                        </div>

                        <label className="field wide">
                          <span>Table notes</span>
                          <input
                            value={table.notes}
                            onChange={(event) =>
                              onTableFieldChange(table.id, 'notes', event.target.value)
                            }
                          />
                        </label>

                        <div className={`seat-grid ${table.shape}`}>
                          {seats.map((guestId, seatIndex) => {
                            const guest = guestId ? guestsById.get(guestId) : null

                            return (
                              <div
                                className={`seat-card${guest ? ' occupied' : ''}`}
                                key={`${table.id}-${seatIndex}`}
                              >
                                <span className="seat-label">Seat {seatIndex + 1}</span>
                                <strong>{guest ? formatGuestLabel(guest) : 'Empty seat'}</strong>
                                <select
                                  value={guestId ?? ''}
                                  onChange={(event) => onSeatChange(table.id, seatIndex, event)}
                                >
                                  <option value="">Leave empty</option>
                                  {planner.guests
                                    .slice()
                                    .sort((first, second) =>
                                      first.name.localeCompare(second.name),
                                    )
                                    .map((optionGuest) => {
                                      const seat = guestSeatLookup.get(optionGuest.id)
                                      const location =
                                        seat && optionGuest.id !== guestId
                                          ? ` - ${seat.tableName}`
                                          : ''

                                          return (
                                            <option key={optionGuest.id} value={optionGuest.id}>
                                              {formatGuestLabel(optionGuest)}
                                              {location}
                                            </option>
                                      )
                                    })}
                                </select>
                              </div>
                            )
                          })}
                        </div>
                      </section>
                    )
                  })
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default RoomsPanel
