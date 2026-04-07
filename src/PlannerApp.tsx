import {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import StatCard from './components/StatCard'
import GuestsPanel from './components/GuestsPanel'
import RelationshipsPanel from './components/RelationshipsPanel'
import RoomsPanel from './components/RoomsPanel'
import VisualPlanPanel from './components/VisualPlanPanel'
import {
  autoAssignGuests,
  cloneSeating,
  createId,
  evaluatePlan,
  formatTagString,
  hydratePlannerData,
  parseTagString,
  seatGuest,
} from './planUtils'
import {
  buildGuestSeatLookup,
  clamp,
  createEmptySeating,
  freshPlanner,
  getStatusCopy,
  getStatusTone,
  loadInitialPlannerData,
  sanitizeFilename,
  setGuestPartner,
  STORAGE_KEY,
} from './plannerHelpers'
import samplePlan from './samplePlan'
import type { PlannerData, Room, Table } from './types'
import {
  emptyAffinityDraft,
  emptyGuestDraft,
  emptyRoomDraft,
  type AffinityDraft,
  type GuestDraft,
  type RoomDraft,
  type TableDraft,
} from './viewModels'

type ActiveView = 'editor' | 'visual'

function PlannerApp() {
  const [planner, setPlanner] = useState(loadInitialPlannerData)
  const [activeView, setActiveView] = useState<ActiveView>('editor')
  const [guestDraft, setGuestDraft] = useState<GuestDraft>(emptyGuestDraft)
  const [roomDraft, setRoomDraft] = useState<RoomDraft>(emptyRoomDraft)
  const [tableDraft, setTableDraft] = useState<TableDraft>({
    roomId: planner.rooms[0]?.id ?? '',
    name: '',
    shape: 'round',
    seatCount: '8',
    notes: '',
  })
  const [affinityDraft, setAffinityDraft] = useState<AffinityDraft>(emptyAffinityDraft)
  const [guestSearch, setGuestSearch] = useState('')
  const [statusMessage, setStatusMessage] = useState(
    'Everything stays in your browser. Export a JSON backup whenever you like.',
  )
  const importRef = useRef<HTMLInputElement | null>(null)

  const deferredGuestSearch = useDeferredValue(guestSearch.trim().toLowerCase())
  const evaluation = evaluatePlan(planner)
  const totalCapacity = planner.tables.reduce((sum, table) => sum + table.seatCount, 0)
  const guestSeatLookup = buildGuestSeatLookup(planner)
  const guestsById = new Map(planner.guests.map((guest) => [guest.id, guest]))
  const roomsById = new Map(planner.rooms.map((room) => [room.id, room]))

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(planner))
  }, [planner])

  useEffect(() => {
    if (!planner.rooms.some((room) => room.id === tableDraft.roomId)) {
      setTableDraft((current) => ({
        ...current,
        roomId: planner.rooms[0]?.id ?? '',
      }))
    }
  }, [planner.rooms, tableDraft.roomId])

  const filteredGuests = planner.guests
    .filter((guest) => {
      if (!deferredGuestSearch) {
        return true
      }

      const haystack = [guest.name, guest.circle, guest.notes, formatTagString(guest.tags)]
        .join(' ')
        .toLowerCase()

      return haystack.includes(deferredGuestSearch)
    })
    .sort((first, second) => first.name.localeCompare(second.name))

  const affinityCards = [...planner.affinities].sort(
    (first, second) => Math.abs(second.score) - Math.abs(first.score),
  )

  const unseatedGuests = planner.guests
    .filter((guest) => !guestSeatLookup.has(guest.id))
    .sort((first, second) => first.name.localeCompare(second.name))

  function handlePlannerReset(nextPlanner: PlannerData, message: string) {
    setPlanner(nextPlanner)
    setStatusMessage(message)
    setTableDraft((current) => ({
      ...current,
      roomId: nextPlanner.rooms[0]?.id ?? '',
    }))
  }

  function handleAddGuest() {
    if (!guestDraft.name.trim()) {
      setStatusMessage('Give the guest a name first.')
      return
    }

    const guestName = guestDraft.name.trim()
    setPlanner((current) => ({
      ...current,
      guests: [
        ...current.guests,
        {
          id: createId('guest'),
          name: guestName,
          age: guestDraft.age ? clamp(Number(guestDraft.age), 0, 120) : null,
          circle: guestDraft.circle.trim(),
          partnerId: null,
          tags: parseTagString(guestDraft.tags),
          notes: guestDraft.notes.trim(),
        },
      ],
    }))
    setGuestDraft(emptyGuestDraft)
    setStatusMessage(`Added ${guestName}.`)
  }

  function handleGuestFieldChange(
    guestId: string,
    field: 'name' | 'age' | 'circle' | 'tags' | 'notes',
    value: string,
  ) {
    setPlanner((current) => ({
      ...current,
      guests: current.guests.map((guest) => {
        if (guest.id !== guestId) {
          return guest
        }

        if (field === 'age') {
          return {
            ...guest,
            age: value ? clamp(Number(value), 0, 120) : null,
          }
        }

        if (field === 'tags') {
          return {
            ...guest,
            tags: parseTagString(value),
          }
        }

        return {
          ...guest,
          [field]: value,
        }
      }),
    }))
  }

  function handlePartnerChange(guestId: string, value: string) {
    setPlanner((current) => setGuestPartner(current, guestId, value || null))
  }

  function handleRemoveGuest(guestId: string) {
    const guest = guestsById.get(guestId)
    if (!guest) {
      return
    }

    const confirmed = window.confirm(
      `Remove ${guest.name} from the planner? Their affinities and seat assignment will also be removed.`,
    )
    if (!confirmed) {
      return
    }

    setPlanner((current) => ({
      ...current,
      guests: current.guests
        .filter((item) => item.id !== guestId)
        .map((item) =>
          item.partnerId === guestId
            ? {
                ...item,
                partnerId: null,
              }
            : item,
        ),
      affinities: current.affinities.filter(
        (affinity) => affinity.guestAId !== guestId && affinity.guestBId !== guestId,
      ),
      seating: Object.fromEntries(
        Object.entries(current.seating).map(([tableId, seats]) => [
          tableId,
          seats.map((seatGuestId) => (seatGuestId === guestId ? null : seatGuestId)),
        ]),
      ),
    }))
    setAffinityDraft((current) => ({
      ...current,
      guestAId: current.guestAId === guestId ? '' : current.guestAId,
      guestBId: current.guestBId === guestId ? '' : current.guestBId,
    }))
    setStatusMessage(`${guest.name} was removed from the plan.`)
  }

  function handleAddRoom() {
    if (!roomDraft.name.trim()) {
      setStatusMessage('Give the room a name first.')
      return
    }

    const roomId = createId('room')
    const roomName = roomDraft.name.trim()

    setPlanner((current) => ({
      ...current,
      rooms: [
        ...current.rooms,
        {
          id: roomId,
          name: roomName,
          notes: roomDraft.notes.trim(),
        },
      ],
    }))
    setRoomDraft(emptyRoomDraft)
    setTableDraft((current) => ({
      ...current,
      roomId,
    }))
    setStatusMessage(`Added the room "${roomName}".`)
  }

  function handleRoomFieldChange(roomId: string, field: keyof Room, value: string) {
    setPlanner((current) => ({
      ...current,
      rooms: current.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              [field]: value,
            }
          : room,
      ),
    }))
  }

  function handleRemoveRoom(roomId: string) {
    const room = roomsById.get(roomId)
    if (!room) {
      return
    }

    if (planner.rooms.length === 1) {
      setStatusMessage('Keep at least one room in the planner.')
      return
    }

    const roomTables = planner.tables.filter((table) => table.roomId === roomId)
    const confirmed = window.confirm(
      `Remove "${room.name}" and its ${roomTables.length} table${
        roomTables.length === 1 ? '' : 's'
      }? Guests seated there will become unseated.`,
    )
    if (!confirmed) {
      return
    }

    setPlanner((current) => {
      const removedTableIds = new Set(
        current.tables.filter((table) => table.roomId === roomId).map((table) => table.id),
      )

      return {
        ...current,
        rooms: current.rooms.filter((item) => item.id !== roomId),
        tables: current.tables.filter((table) => table.roomId !== roomId),
        seating: Object.fromEntries(
          Object.entries(current.seating).filter(([tableId]) => !removedTableIds.has(tableId)),
        ),
      }
    })
    setStatusMessage(`Removed "${room.name}".`)
  }

  function handleAddTable() {
    const roomId = tableDraft.roomId || planner.rooms[0]?.id
    if (!roomId) {
      setStatusMessage('Create a room before adding a table.')
      return
    }

    if (!tableDraft.name.trim()) {
      setStatusMessage('Give the table a name first.')
      return
    }

    const tableId = createId('table')
    const tableName = tableDraft.name.trim()
    const seatCount = clamp(Number(tableDraft.seatCount) || 8, 1, 20)

    setPlanner((current) => ({
      ...current,
      tables: [
        ...current.tables,
        {
          id: tableId,
          roomId,
          name: tableName,
          shape: tableDraft.shape,
          seatCount,
          notes: tableDraft.notes.trim(),
        },
      ],
      seating: {
        ...current.seating,
        [tableId]: Array(seatCount).fill(null),
      },
    }))
    setTableDraft((current) => ({
      ...current,
      name: '',
      notes: '',
    }))
    setStatusMessage(`Added the table "${tableName}".`)
  }

  function handleTableFieldChange(tableId: string, field: keyof Table, value: string) {
    setPlanner((current) => {
      const tables = current.tables.map((table) => {
        if (table.id !== tableId) {
          return table
        }

        if (field === 'seatCount') {
          return {
            ...table,
            seatCount: clamp(Number(value) || table.seatCount, 1, 20),
          }
        }

        return {
          ...table,
          [field]: value,
        }
      })

      const updatedTable = tables.find((table) => table.id === tableId)
      const seating = cloneSeating(current.seating)
      if (updatedTable) {
        const currentSeats = seating[tableId] ?? []
        seating[tableId] = Array.from(
          { length: updatedTable.seatCount },
          (_, index) => currentSeats[index] ?? null,
        )
      }

      return {
        ...current,
        tables,
        seating,
      }
    })
  }

  function handleRemoveTable(tableId: string) {
    const table = planner.tables.find((item) => item.id === tableId)
    if (!table) {
      return
    }

    const confirmed = window.confirm(
      `Remove "${table.name}"? Guests currently seated there will become unseated.`,
    )
    if (!confirmed) {
      return
    }

    setPlanner((current) => ({
      ...current,
      tables: current.tables.filter((item) => item.id !== tableId),
      seating: Object.fromEntries(
        Object.entries(current.seating).filter(([currentTableId]) => currentTableId !== tableId),
      ),
    }))
    setStatusMessage(`Removed "${table.name}".`)
  }

  function handleSeatChange(
    tableId: string,
    seatIndex: number,
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const guestId = event.target.value || null
    setPlanner((current) => seatGuest(current, tableId, seatIndex, guestId))
  }

  function handleMoveGuest(guestId: string, tableId: string, seatIndex: number) {
    const guest = guestsById.get(guestId)

    setPlanner((current) => {
      const seating = cloneSeating(current.seating)
      const targetSeats = seating[tableId]

      if (!targetSeats) {
        return current
      }

      let sourceSeat: { tableId: string; seatIndex: number } | null = null

      for (const [currentTableId, seats] of Object.entries(seating)) {
        const currentSeatIndex = seats.findIndex((seatGuestId) => seatGuestId === guestId)
        if (currentSeatIndex >= 0) {
          sourceSeat = {
            tableId: currentTableId,
            seatIndex: currentSeatIndex,
          }
          break
        }
      }

      if (sourceSeat?.tableId === tableId && sourceSeat.seatIndex === seatIndex) {
        return current
      }

      const targetGuestId = targetSeats[seatIndex] ?? null

      if (sourceSeat) {
        seating[sourceSeat.tableId][sourceSeat.seatIndex] = targetGuestId
      } else {
        for (const [currentTableId, seats] of Object.entries(seating)) {
          seating[currentTableId] = seats.map((seatGuestId) =>
            seatGuestId === guestId ? null : seatGuestId,
          )
        }
      }

      seating[tableId][seatIndex] = guestId

      return {
        ...current,
        seating,
      }
    })

    setStatusMessage(`${guest?.name ?? 'Guest'} moved.`)
  }

  function handleUnseatGuest(guestId: string) {
    const guest = guestsById.get(guestId)

    setPlanner((current) => ({
      ...current,
      seating: Object.fromEntries(
        Object.entries(current.seating).map(([tableId, seats]) => [
          tableId,
          seats.map((seatGuestId) => (seatGuestId === guestId ? null : seatGuestId)),
        ]),
      ),
    }))
    setStatusMessage(`${guest?.name ?? 'Guest'} is now unseated.`)
  }

  function handleAddAffinity() {
    if (!affinityDraft.guestAId || !affinityDraft.guestBId) {
      setStatusMessage('Pick both guests for the relationship.')
      return
    }

    if (affinityDraft.guestAId === affinityDraft.guestBId) {
      setStatusMessage('A relationship needs two different guests.')
      return
    }

    const score = clamp(Number(affinityDraft.score) || 0, -100, 100)
    setPlanner((current) => {
      const existing = current.affinities.find(
        (affinity) =>
          (affinity.guestAId === affinityDraft.guestAId &&
            affinity.guestBId === affinityDraft.guestBId) ||
          (affinity.guestAId === affinityDraft.guestBId &&
            affinity.guestBId === affinityDraft.guestAId),
      )

      if (existing) {
        return {
          ...current,
          affinities: current.affinities.map((affinity) =>
            affinity.id === existing.id
              ? {
                  ...affinity,
                  score,
                  note: affinityDraft.note.trim(),
                }
              : affinity,
          ),
        }
      }

      return {
        ...current,
        affinities: [
          ...current.affinities,
          {
            id: createId('affinity'),
            guestAId: affinityDraft.guestAId,
            guestBId: affinityDraft.guestBId,
            score,
            note: affinityDraft.note.trim(),
          },
        ],
      }
    })
    setStatusMessage('Relationship saved.')
    setAffinityDraft((current) => ({
      ...current,
      score: current.score || '40',
      note: '',
    }))
  }

  function handleAffinityFieldChange(
    affinityId: string,
    field: 'score' | 'note',
    value: string,
  ) {
    setPlanner((current) => ({
      ...current,
      affinities: current.affinities.map((affinity) =>
        affinity.id === affinityId
          ? {
              ...affinity,
              [field]: field === 'score' ? clamp(Number(value) || 0, -100, 100) : value,
            }
          : affinity,
      ),
    }))
  }

  function handleRemoveAffinity(affinityId: string) {
    setPlanner((current) => ({
      ...current,
      affinities: current.affinities.filter((affinity) => affinity.id !== affinityId),
    }))
    setStatusMessage('Relationship removed.')
  }

  function handleAutoSeat(mode: 'all' | 'unseated') {
    setStatusMessage(
      mode === 'all'
        ? 'Rebuilding the whole seating plan.'
        : 'Placing the remaining guests based on your current constraints.',
    )

    startTransition(() => {
      setPlanner((current) => autoAssignGuests(current, mode))
    })
  }

  function handleClearAssignments() {
    const confirmed = window.confirm('Clear every seat assignment?')
    if (!confirmed) {
      return
    }

    setPlanner((current) => ({
      ...current,
      seating: createEmptySeating(current),
    }))
    setStatusMessage('All assignments cleared.')
  }

  function handleExport() {
    const payload = JSON.stringify(planner, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const filename = sanitizeFilename(planner.eventName) || 'plan-de-table'
    anchor.href = url
    anchor.download = `${filename}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatusMessage('JSON backup exported.')
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const content = await file.text()
      handlePlannerReset(hydratePlannerData(JSON.parse(content)), `Imported "${file.name}".`)
    } catch {
      setStatusMessage('Import failed. The JSON file could not be read.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="app-shell">
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleImport}
      />

      <header className="hero-panel panel">
        <div className="hero-copy">
          <span className="eyebrow">Plan de table studio</span>
          <h1>Build a seating plan that feels thoughtful, not stressful.</h1>
          <p className="hero-text">
            This planner keeps the basics easy while still giving you serious
            controls: room layouts, table sizes, couples, age, social circles, and
            pair scores from "please seat together" to "avoid at all cost".
          </p>
          <div className="title-row">
            <label className="field wide">
              <span>Event name</span>
              <input
                value={planner.eventName}
                onChange={(event) =>
                  setPlanner((current) => ({
                    ...current,
                    eventName: event.target.value,
                  }))
                }
                placeholder="Lucie & Marc"
              />
            </label>
            <div className={`status-pill ${getStatusTone(evaluation.score, evaluation.hardConflicts)}`}>
              <strong>Plan health</strong>
              <span>
                {getStatusCopy(
                  evaluation.score,
                  evaluation.hardConflicts,
                  evaluation.unseatedGuests,
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <div className="button-row">
            <button className="primary" onClick={() => handleAutoSeat('unseated')}>
              Seat remaining guests
            </button>
            <button onClick={() => handleAutoSeat('all')}>Rebuild all seating</button>
            <button onClick={handleClearAssignments}>Clear seats</button>
          </div>
          <div className="button-row">
            <button onClick={handleExport}>Export JSON</button>
            <button onClick={() => importRef.current?.click()}>Import JSON</button>
            <button onClick={() => handlePlannerReset(samplePlan, 'Loaded the example wedding.')}>
              Load example
            </button>
            <button onClick={() => handlePlannerReset(freshPlanner(), 'Started with a fresh plan.')}>
              Start fresh
            </button>
          </div>
          <p className="helper-copy">{statusMessage}</p>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard label="Guests" value={`${planner.guests.length}`} />
        <StatCard label="Seats filled" value={`${evaluation.seatedGuests} / ${totalCapacity}`} />
        <StatCard
          label="Compatibility score"
          value={`${evaluation.score}`}
          accent={evaluation.score >= 80 && evaluation.hardConflicts === 0}
        />
        <StatCard
          label="Hard conflicts"
          value={`${evaluation.hardConflicts}`}
          accent={evaluation.hardConflicts === 0}
        />
      </section>

      <nav className="view-tabs" aria-label="Planner views">
        <button
          className={activeView === 'editor' ? 'active' : ''}
          aria-pressed={activeView === 'editor'}
          onClick={() => setActiveView('editor')}
        >
          Editor
        </button>
        <button
          className={activeView === 'visual' ? 'active' : ''}
          aria-pressed={activeView === 'visual'}
          onClick={() => setActiveView('visual')}
        >
          Visual plan
        </button>
      </nav>

      {activeView === 'editor' ? (
        <main className="planner-grid">
          <RoomsPanel
            planner={planner}
            guestsById={guestsById}
            guestSeatLookup={guestSeatLookup}
            unseatedGuests={unseatedGuests}
            roomDraft={roomDraft}
            tableDraft={tableDraft}
            onRoomDraftChange={(field, value) =>
              setRoomDraft((current) => ({ ...current, [field]: value }))
            }
            onAddRoom={handleAddRoom}
            onRoomFieldChange={handleRoomFieldChange}
            onRemoveRoom={handleRemoveRoom}
            onTableDraftChange={(field, value) =>
              setTableDraft((current) => ({ ...current, [field]: value }))
            }
            onAddTable={handleAddTable}
            onTableFieldChange={handleTableFieldChange}
            onRemoveTable={handleRemoveTable}
            onSeatChange={handleSeatChange}
          />

          <GuestsPanel
            planner={planner}
            filteredGuests={filteredGuests}
            guestSeatLookup={guestSeatLookup}
            guestDraft={guestDraft}
            guestSearch={guestSearch}
            onGuestDraftChange={(field, value) =>
              setGuestDraft((current) => ({ ...current, [field]: value }))
            }
            onAddGuest={handleAddGuest}
            onGuestSearchChange={setGuestSearch}
            onGuestFieldChange={handleGuestFieldChange}
            onPartnerChange={handlePartnerChange}
            onRemoveGuest={handleRemoveGuest}
          />

          <RelationshipsPanel
            planner={planner}
            guestsById={guestsById}
            affinityCards={affinityCards}
            affinityDraft={affinityDraft}
            onAffinityDraftChange={(field, value) =>
              setAffinityDraft((current) => ({ ...current, [field]: value }))
            }
            onAddAffinity={handleAddAffinity}
            onAffinityFieldChange={handleAffinityFieldChange}
            onRemoveAffinity={handleRemoveAffinity}
          />
        </main>
      ) : (
        <main className="visual-grid">
          <VisualPlanPanel
            planner={planner}
            guestsById={guestsById}
            unseatedGuests={unseatedGuests}
            onMoveGuest={handleMoveGuest}
            onUnseatGuest={handleUnseatGuest}
          />
        </main>
      )}
    </div>
  )
}

export default PlannerApp
