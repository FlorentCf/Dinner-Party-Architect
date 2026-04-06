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
  onRemoveGuest: (guestId: string) => void
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
  onRemoveGuest,
}: GuestsPanelProps) {
  return (
    <section className="panel">
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
                    <strong>{guest.name}</strong>
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
                            {optionGuest.name}
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
