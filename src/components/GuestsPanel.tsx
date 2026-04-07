import { useRef, useState, type ChangeEvent } from 'react'
import { formatTagString } from '../planUtils'
import type { Guest, PlannerData } from '../types'
import type { GuestDraft, GuestSeatInfo } from '../viewModels'

type GuestsPanelProps = {
  planner: PlannerData
  filteredGuests: Guest[]
  guestSeatLookup: Map<string, GuestSeatInfo>
  guestDraft: GuestDraft
  guestSearch: string
  onGuestDraftChange: (field: keyof GuestDraft, value: string) => void
  onAddGuest: () => void
  onGuestSearchChange: (value: string) => void
  onGuestFieldChange: (
    guestId: string,
    field: 'name' | 'age' | 'circle' | 'tags' | 'notes',
    value: string,
  ) => void
  onPartnerChange: (guestId: string, value: string) => void
  onGuestTableLockChange: (guestId: string, tableId: string) => void
  onRemoveGuest: (guestId: string) => void
  onImportGuests: (rawGuestList: string) => void
}

function formatGuestLabel(guest: Guest) {
  return guest.importId ? `${guest.name} (ID ${guest.importId})` : guest.name
}

function GuestsPanel({
  planner,
  filteredGuests,
  guestSeatLookup,
  guestDraft,
  guestSearch,
  onGuestDraftChange,
  onAddGuest,
  onGuestSearchChange,
  onGuestFieldChange,
  onPartnerChange,
  onGuestTableLockChange,
  onRemoveGuest,
  onImportGuests,
}: GuestsPanelProps) {
  const [importText, setImportText] = useState('')
  const importFileRef = useRef<HTMLInputElement | null>(null)

  function handlePastedImport() {
    onImportGuests(importText)
    setImportText('')
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const content = await file.text()
    onImportGuests(content)
    event.target.value = ''
  }

  return (
    <section className="panel">
      <input
        ref={importFileRef}
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        hidden
        onChange={handleImportFile}
      />

      <div className="section-heading">
        <div>
          <span className="section-kicker">2. Guests</span>
          <h2>Capture the human side.</h2>
        </div>
        <p>
          Add age, circles, tags, partners, and notes so the app understands who
          belongs where.
        </p>
      </div>

      <div className="editor-card">
        <div className="form-grid guest-add-grid">
          <label className="field">
            <span>Name</span>
            <input
              value={guestDraft.name}
              onChange={(event) => onGuestDraftChange('name', event.target.value)}
              placeholder="Sophie"
            />
          </label>
          <label className="field">
            <span>Age</span>
            <input
              type="number"
              min="0"
              max="120"
              value={guestDraft.age}
              onChange={(event) => onGuestDraftChange('age', event.target.value)}
              placeholder="31"
            />
          </label>
          <label className="field">
            <span>Circle</span>
            <input
              value={guestDraft.circle}
              onChange={(event) => onGuestDraftChange('circle', event.target.value)}
              placeholder="Bride side"
            />
          </label>
          <label className="field wide">
            <span>Tags</span>
            <input
              value={guestDraft.tags}
              onChange={(event) => onGuestDraftChange('tags', event.target.value)}
              placeholder="family, friends, kids"
            />
          </label>
          <label className="field wide">
            <span>Notes</span>
            <input
              value={guestDraft.notes}
              onChange={(event) => onGuestDraftChange('notes', event.target.value)}
              placeholder="Would prefer a quiet table"
            />
          </label>
          <button onClick={onAddGuest}>Add guest</button>
        </div>
      </div>

      <div className="editor-card import-card">
        <div className="import-card-copy">
          <div>
            <span className="section-kicker">Bulk import</span>
            <h3>Paste a guest list or import a CSV file.</h3>
          </div>
          <p>
            Works with one name per line, or columns like
            <code>id, name, age, circle, tags, notes, partner, table</code>. If
            <code>id</code> is present, <code>partner</code> is treated as a
            partner ID and duplicate names are allowed.
          </p>
        </div>
        <label className="field wide">
          <span>Paste list</span>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder={'id,name,age,circle,tags,notes,partner,table\n1,Alice Dupont,37,Bride side,family,,2,\n2,Alice Dupont,39,Bride side,family,,1,'}
          />
        </label>
        <div className="button-row import-actions">
          <button className="primary" onClick={handlePastedImport}>
            Import pasted list
          </button>
          <button onClick={() => importFileRef.current?.click()}>Import CSV/TXT file</button>
        </div>
      </div>

      <div className="toolbar-row">
        <label className="field wide">
          <span>Search guests</span>
          <input
            value={guestSearch}
            onChange={(event) => onGuestSearchChange(event.target.value)}
            placeholder="Find by name, circle, notes, or tags"
          />
        </label>
      </div>

      <div className="guest-list">
        {filteredGuests.length === 0 ? (
          <div className="empty-card">No guests match your search.</div>
        ) : (
          filteredGuests.map((guest) => {
            const seat = guestSeatLookup.get(guest.id)

            return (
              <article className="guest-card" key={guest.id}>
                <div className="guest-card-top">
                  <div className="guest-status">
                    <strong>{formatGuestLabel(guest)}</strong>
                    <span className={`seat-badge ${seat ? 'filled' : 'empty'}`}>
                      {seat
                        ? `${seat.roomName} / ${seat.tableName} / Seat ${seat.seatIndex + 1}`
                        : 'Unseated'}
                    </span>
                  </div>
                  <button className="ghost danger" onClick={() => onRemoveGuest(guest.id)}>
                    Remove
                  </button>
                </div>

                <div className="form-grid guest-editor-grid">
                  <label className="field">
                    <span>Name</span>
                    <input
                      value={guest.name}
                      onChange={(event) =>
                        onGuestFieldChange(guest.id, 'name', event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Age</span>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={guest.age ?? ''}
                      onChange={(event) =>
                        onGuestFieldChange(guest.id, 'age', event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Circle</span>
                    <input
                      value={guest.circle}
                      onChange={(event) =>
                        onGuestFieldChange(guest.id, 'circle', event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Partner</span>
                    <select
                      value={guest.partnerId ?? ''}
                      onChange={(event) => onPartnerChange(guest.id, event.target.value)}
                    >
                      <option value="">No partner</option>
                      {planner.guests
                        .filter((optionGuest) => optionGuest.id !== guest.id)
                        .sort((first, second) => first.name.localeCompare(second.name))
                        .map((optionGuest) => (
                          <option key={optionGuest.id} value={optionGuest.id}>
                            {formatGuestLabel(optionGuest)}
                          </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Fixed table</span>
                    <select
                      value={guest.lockedTableId ?? ''}
                      onChange={(event) =>
                        onGuestTableLockChange(guest.id, event.target.value)
                      }
                    >
                      <option value="">No fixed table</option>
                      {planner.tables
                        .slice()
                        .sort((first, second) => first.name.localeCompare(second.name))
                        .map((table) => (
                          <option key={table.id} value={table.id}>
                            {table.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="field wide">
                    <span>Tags</span>
                    <input
                      value={formatTagString(guest.tags)}
                      onChange={(event) =>
                        onGuestFieldChange(guest.id, 'tags', event.target.value)
                      }
                    />
                  </label>
                  <label className="field wide">
                    <span>Notes</span>
                    <input
                      value={guest.notes}
                      onChange={(event) =>
                        onGuestFieldChange(guest.id, 'notes', event.target.value)
                      }
                    />
                  </label>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

export default GuestsPanel
