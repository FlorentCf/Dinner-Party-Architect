import type { PlannerData } from '../types'
import type { AffinityDraft } from '../viewModels'

type RelationshipsPanelProps = {
  planner: PlannerData
  guestsById: Map<string, { id: string; name: string }>
  affinityCards: PlannerData['affinities']
  affinityDraft: AffinityDraft
  onAffinityDraftChange: (field: keyof AffinityDraft, value: string) => void
  onAddAffinity: () => void
  onAffinityFieldChange: (
    affinityId: string,
    field: 'score' | 'note',
    value: string,
  ) => void
  onRemoveAffinity: (affinityId: string) => void
}

function RelationshipsPanel({
  planner,
  guestsById,
  affinityCards,
  affinityDraft,
  onAffinityDraftChange,
  onAddAffinity,
  onAffinityFieldChange,
  onRemoveAffinity,
}: RelationshipsPanelProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <span className="section-kicker">3. Relationships</span>
          <h2>Tell the planner who clicks and who does not.</h2>
        </div>
        <p>
          Use +100 as "must sit together" and -100 as "avoid at all cost".
          Softer scores still guide the smart assigner.
        </p>
      </div>

      <div className="editor-card">
        <div className="form-grid affinity-grid">
          <label className="field">
            <span>Guest A</span>
            <select
              value={affinityDraft.guestAId}
              onChange={(event) => onAffinityDraftChange('guestAId', event.target.value)}
            >
              <option value="">Choose a guest</option>
              {planner.guests
                .slice()
                .sort((first, second) => first.name.localeCompare(second.name))
                .map((guest) => (
                  <option key={guest.id} value={guest.id}>
                    {guest.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            <span>Guest B</span>
            <select
              value={affinityDraft.guestBId}
              onChange={(event) => onAffinityDraftChange('guestBId', event.target.value)}
            >
              <option value="">Choose a guest</option>
              {planner.guests
                .slice()
                .sort((first, second) => first.name.localeCompare(second.name))
                .map((guest) => (
                  <option key={guest.id} value={guest.id}>
                    {guest.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            <span>Score</span>
            <input
              type="number"
              min="-100"
              max="100"
              value={affinityDraft.score}
              onChange={(event) => onAffinityDraftChange('score', event.target.value)}
            />
          </label>
          <label className="field wide">
            <span>Why?</span>
            <input
              value={affinityDraft.note}
              onChange={(event) => onAffinityDraftChange('note', event.target.value)}
              placeholder="Best friends, exes, calm energy, kids table..."
            />
          </label>
          <button onClick={onAddAffinity}>Save relationship</button>
        </div>
      </div>

      <div className="affinity-list">
        {affinityCards.length === 0 ? (
          <div className="empty-card">
            No pair scores yet. Couples and circles already help, but explicit
            affinities make the auto-seating much smarter.
          </div>
        ) : (
          affinityCards.map((affinity) => {
            const guestA = guestsById.get(affinity.guestAId)
            const guestB = guestsById.get(affinity.guestBId)

            if (!guestA || !guestB) {
              return null
            }

            return (
              <article
                className={`affinity-card ${affinity.score >= 0 ? 'positive' : 'negative'}`}
                key={affinity.id}
              >
                <div className="affinity-top">
                  <strong>
                    {guestA.name} + {guestB.name}
                  </strong>
                  <span className="score-tag">{affinity.score}</span>
                </div>

                <div className="form-grid affinity-editor-grid">
                  <label className="field">
                    <span>Score</span>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={affinity.score}
                      onChange={(event) =>
                        onAffinityFieldChange(affinity.id, 'score', event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Numeric score</span>
                    <input
                      type="number"
                      min="-100"
                      max="100"
                      value={affinity.score}
                      onChange={(event) =>
                        onAffinityFieldChange(affinity.id, 'score', event.target.value)
                      }
                    />
                  </label>
                  <label className="field wide">
                    <span>Notes</span>
                    <input
                      value={affinity.note}
                      onChange={(event) =>
                        onAffinityFieldChange(affinity.id, 'note', event.target.value)
                      }
                    />
                  </label>
                  <button className="ghost danger" onClick={() => onRemoveAffinity(affinity.id)}>
                    Delete
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

export default RelationshipsPanel
