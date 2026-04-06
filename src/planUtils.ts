import type {
  Affinity,
  Guest,
  PlanEvaluation,
  PlannerData,
  Room,
  Table,
} from './types'

const HARD_AVOID_SCORE = -90

export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function parseTagString(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

export function formatTagString(tags: string[]) {
  return tags.join(', ')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

function normalizeGuest(value: unknown): Guest | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    id: asString(value.id, createId('guest')),
    name: asString(value.name, 'Guest'),
    age:
      typeof value.age === 'number' && Number.isFinite(value.age)
        ? clamp(Math.round(value.age), 0, 120)
        : null,
    circle: asString(value.circle),
    partnerId: typeof value.partnerId === 'string' ? value.partnerId : null,
    tags: Array.isArray(value.tags)
      ? value.tags.map((item) => asString(item)).filter(Boolean)
      : [],
    notes: asString(value.notes),
  }
}

function normalizeRoom(value: unknown): Room | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    id: asString(value.id, createId('room')),
    name: asString(value.name, 'Room'),
    notes: asString(value.notes),
  }
}

function normalizeTable(value: unknown, fallbackRoomId: string): Table | null {
  if (!isRecord(value)) {
    return null
  }

  const shape = asString(value.shape, 'round')
  const supportedShape = ['round', 'rectangle', 'oval', 'kids'].includes(shape)
    ? shape
    : 'round'

  return {
    id: asString(value.id, createId('table')),
    roomId: asString(value.roomId, fallbackRoomId),
    name: asString(value.name, 'Table'),
    shape: supportedShape as Table['shape'],
    seatCount: clamp(Math.round(asNumber(value.seatCount, 8)), 1, 20),
    notes: asString(value.notes),
  }
}

function normalizeAffinity(
  value: unknown,
  validGuestIds: Set<string>,
): Affinity | null {
  if (!isRecord(value)) {
    return null
  }

  const guestAId = asString(value.guestAId)
  const guestBId = asString(value.guestBId)

  if (
    !guestAId ||
    !guestBId ||
    guestAId === guestBId ||
    !validGuestIds.has(guestAId) ||
    !validGuestIds.has(guestBId)
  ) {
    return null
  }

  return {
    id: asString(value.id, createId('affinity')),
    guestAId,
    guestBId,
    score: clamp(Math.round(asNumber(value.score, 0)), -100, 100),
    note: asString(value.note),
  }
}

export function createEmptyPlannerData(): PlannerData {
  const roomId = createId('room')
  const tableId = createId('table')

  return {
    eventName: 'Our celebration',
    rooms: [
      {
        id: roomId,
        name: 'Main room',
        notes: '',
      },
    ],
    tables: [
      {
        id: tableId,
        roomId,
        name: 'Table 1',
        shape: 'round',
        seatCount: 8,
        notes: '',
      },
    ],
    guests: [],
    affinities: [],
    seating: {
      [tableId]: Array(8).fill(null),
    },
  }
}

export function hydratePlannerData(value: unknown): PlannerData {
  const fallback = createEmptyPlannerData()
  if (!isRecord(value)) {
    return fallback
  }

  const rooms =
    Array.isArray(value.rooms) && value.rooms.length > 0
      ? value.rooms.map(normalizeRoom).filter(isPresent)
      : fallback.rooms

  const primaryRoomId = rooms[0]?.id ?? fallback.rooms[0].id
  const tables = Array.isArray(value.tables)
    ? value.tables
        .map((table) => normalizeTable(table, primaryRoomId))
        .filter(isPresent)
        .map((table) => ({
          ...table,
          roomId: rooms.some((room) => room.id === table.roomId)
            ? table.roomId
            : primaryRoomId,
        }))
    : fallback.tables

  const guests = Array.isArray(value.guests)
    ? value.guests.map(normalizeGuest).filter(isPresent)
    : fallback.guests

  const validGuestIds = new Set(guests.map((guest) => guest.id))
  const affinities = Array.isArray(value.affinities)
    ? value.affinities
        .map((affinity) => normalizeAffinity(affinity, validGuestIds))
        .filter(isPresent)
    : fallback.affinities

  const seating = sanitizeSeating(
    isRecord(value.seating) ? value.seating : {},
    tables,
    validGuestIds,
  )

  const guestMap = new Map(guests.map((guest) => [guest.id, guest]))
  const normalizedGuests = guests.map((guest) => ({
    ...guest,
    partnerId:
      guest.partnerId && guestMap.has(guest.partnerId) ? guest.partnerId : null,
  }))

  return {
    eventName: asString(value.eventName, fallback.eventName),
    rooms,
    tables,
    guests: normalizedGuests,
    affinities,
    seating,
  }
}

function sanitizeSeating(
  rawSeating: Record<string, unknown>,
  tables: Table[],
  validGuestIds: Set<string>,
) {
  const usedGuestIds = new Set<string>()
  const seating: PlannerData['seating'] = {}

  for (const table of tables) {
    const rawSeats = Array.isArray(rawSeating[table.id])
      ? (rawSeating[table.id] as unknown[])
      : []
    const nextSeats = Array.from({ length: table.seatCount }, (_, index) => {
      const rawSeat = rawSeats[index]
      if (
        typeof rawSeat === 'string' &&
        validGuestIds.has(rawSeat) &&
        !usedGuestIds.has(rawSeat)
      ) {
        usedGuestIds.add(rawSeat)
        return rawSeat
      }

      return null
    })

    seating[table.id] = nextSeats
  }

  return seating
}

export function seatGuest(
  planner: PlannerData,
  tableId: string,
  seatIndex: number,
  guestId: string | null,
): PlannerData {
  const seating = cloneSeating(planner.seating)

  for (const [currentTableId, seats] of Object.entries(seating)) {
    seating[currentTableId] = seats.map((seatGuestId) =>
      seatGuestId === guestId ? null : seatGuestId,
    )
  }

  if (seating[tableId]) {
    seating[tableId][seatIndex] = guestId
  }

  return {
    ...planner,
    seating,
  }
}

export function cloneSeating(seating: PlannerData['seating']) {
  return Object.fromEntries(
    Object.entries(seating).map(([tableId, seats]) => [tableId, [...seats]]),
  )
}

function buildAffinityMap(affinities: Affinity[]) {
  const affinityMap = new Map<string, number>()

  for (const affinity of affinities) {
    affinityMap.set(makePairKey(affinity.guestAId, affinity.guestBId), affinity.score)
  }

  return affinityMap
}

function makePairKey(firstId: string, secondId: string) {
  return [firstId, secondId].sort().join('::')
}

function getExplicitAffinity(
  affinityMap: Map<string, number>,
  firstId: string,
  secondId: string,
) {
  return affinityMap.get(makePairKey(firstId, secondId)) ?? 0
}

function getGuestAgeBand(age: number | null) {
  if (age === null) {
    return 'unknown'
  }

  if (age <= 12) {
    return 'child'
  }

  if (age <= 17) {
    return 'teen'
  }

  if (age <= 64) {
    return 'adult'
  }

  return 'senior'
}

function getPairScore(
  first: Guest,
  second: Guest,
  affinityMap: Map<string, number>,
) {
  const explicit = getExplicitAffinity(affinityMap, first.id, second.id)
  const sharedTags = first.tags.filter((tag) => second.tags.includes(tag)).length
  const sameCircle =
    first.circle.trim() && first.circle.trim() === second.circle.trim()
  const firstAgeBand = getGuestAgeBand(first.age)
  const secondAgeBand = getGuestAgeBand(second.age)

  let score = explicit

  if (first.partnerId === second.id || second.partnerId === first.id) {
    score += 24
  }

  if (sameCircle) {
    score += 6
  }

  if (sharedTags > 0) {
    score += Math.min(sharedTags, 3) * 2
  }

  if (
    firstAgeBand !== 'unknown' &&
    firstAgeBand === secondAgeBand &&
    firstAgeBand !== 'adult'
  ) {
    score += 4
  }

  if (
    (firstAgeBand === 'child' && secondAgeBand === 'adult') ||
    (firstAgeBand === 'adult' && secondAgeBand === 'child')
  ) {
    score -= 3
  }

  return score
}

function getAdjacentIndexes(seatIndex: number, seatCount: number, table: Table) {
  if (seatCount <= 1) {
    return []
  }

  if (table.shape === 'round' || table.shape === 'oval') {
    return [
      (seatIndex - 1 + seatCount) % seatCount,
      (seatIndex + 1) % seatCount,
    ]
  }

  return [seatIndex - 1, seatIndex + 1].filter(
    (index) => index >= 0 && index < seatCount,
  )
}

function scoreSeatChoice(
  planner: PlannerData,
  table: Table,
  seatIndex: number,
  guest: Guest,
  affinityMap: Map<string, number>,
) {
  const guestMap = new Map(planner.guests.map((currentGuest) => [currentGuest.id, currentGuest]))
  const tableSeats = planner.seating[table.id] ?? []
  const occupants = tableSeats
    .map((guestId) => (guestId ? guestMap.get(guestId) ?? null : null))
    .filter(isPresent)

  let score = 0
  let hardConflict = false

  for (const occupant of occupants) {
    const pairScore = getPairScore(guest, occupant, affinityMap)
    score += pairScore
    if (pairScore <= HARD_AVOID_SCORE) {
      hardConflict = true
      score -= 500
    }
  }

  const adjacentIndexes = getAdjacentIndexes(seatIndex, table.seatCount, table)
  for (const adjacentIndex of adjacentIndexes) {
    const adjacentGuestId = tableSeats[adjacentIndex]
    if (!adjacentGuestId) {
      continue
    }

    const adjacentGuest = guestMap.get(adjacentGuestId)
    if (!adjacentGuest) {
      continue
    }

    const pairScore = getPairScore(guest, adjacentGuest, affinityMap)
    score += pairScore * 0.35

    if (guest.partnerId === adjacentGuest.id || adjacentGuest.partnerId === guest.id) {
      score += 8
    }
  }

  if (guest.partnerId) {
    const partnerSeat = getGuestSeat(planner.seating, guest.partnerId)
    if (partnerSeat) {
      if (partnerSeat.tableId === table.id) {
        score += 12
      } else {
        score -= 25
      }
    } else if (tableSeats.filter(Boolean).length < table.seatCount - 1) {
      score += 4
    }
  }

  return { score, hardConflict }
}

function getGuestSeat(seating: PlannerData['seating'], guestId: string) {
  for (const [tableId, seats] of Object.entries(seating)) {
    const seatIndex = seats.findIndex((seatGuestId) => seatGuestId === guestId)
    if (seatIndex >= 0) {
      return { tableId, seatIndex }
    }
  }

  return null
}

function sortGuestsByDifficulty(planner: PlannerData, affinityMap: Map<string, number>) {
  return [...planner.guests].sort((first, second) => {
    const firstDifficulty = getGuestDifficulty(first, planner, affinityMap)
    const secondDifficulty = getGuestDifficulty(second, planner, affinityMap)
    return secondDifficulty - firstDifficulty
  })
}

function getGuestDifficulty(
  guest: Guest,
  planner: PlannerData,
  affinityMap: Map<string, number>,
) {
  const explicitEdges = planner.affinities.filter(
    (affinity) => affinity.guestAId === guest.id || affinity.guestBId === guest.id,
  )
  const strongAvoids = explicitEdges.filter((affinity) => affinity.score <= -50).length
  const strongMatches = explicitEdges.filter((affinity) => affinity.score >= 50).length

  return (
    strongAvoids * 5 +
    strongMatches * 4 +
    (guest.partnerId ? 6 : 0) +
    guest.tags.length +
    Math.abs(
      planner.guests.reduce((sum, other) => {
        if (other.id === guest.id) {
          return sum
        }

        return sum + getExplicitAffinity(affinityMap, guest.id, other.id)
      }, 0),
    ) /
      20
  )
}

function shuffle<T>(values: T[]) {
  const nextValues = [...values]

  for (let index = nextValues.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = nextValues[index]
    nextValues[index] = nextValues[swapIndex]
    nextValues[swapIndex] = current
  }

  return nextValues
}

function clearSeating(planner: PlannerData) {
  return Object.fromEntries(
    planner.tables.map((table) => [table.id, Array(table.seatCount).fill(null)]),
  )
}

export function autoAssignGuests(
  planner: PlannerData,
  mode: 'all' | 'unseated' = 'unseated',
) {
  const basePlanner: PlannerData =
    mode === 'all'
      ? {
          ...planner,
          seating: clearSeating(planner),
        }
      : {
          ...planner,
          seating: cloneSeating(planner.seating),
        }

  const affinityMap = buildAffinityMap(planner.affinities)
  const orderedGuests = sortGuestsByDifficulty(planner, affinityMap)
  const targetGuests =
    mode === 'all'
      ? orderedGuests
      : orderedGuests.filter((guest) => !getGuestSeat(planner.seating, guest.id))

  let bestPlanner = basePlanner
  let bestScore = evaluatePlan(basePlanner).score

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const workingPlanner: PlannerData = {
      ...basePlanner,
      seating: cloneSeating(basePlanner.seating),
    }

    for (const guest of shuffle(targetGuests)) {
      const options = workingPlanner.tables
        .flatMap((table) =>
          Array.from({ length: table.seatCount }, (_, seatIndex) => ({
            table,
            seatIndex,
            currentGuestId: workingPlanner.seating[table.id]?.[seatIndex] ?? null,
          })),
        )
        .filter((option) => !option.currentGuestId)
        .map((option) => ({
          ...option,
          ...scoreSeatChoice(workingPlanner, option.table, option.seatIndex, guest, affinityMap),
          noise: Math.random() * 2.5,
        }))
        .sort((first, second) => second.score + second.noise - (first.score + first.noise))

      const bestValidOption = options.find((option) => !option.hardConflict)
      const fallbackOption = options[0]
      const chosenOption = bestValidOption ?? fallbackOption

      if (!chosenOption) {
        continue
      }

      workingPlanner.seating[chosenOption.table.id][chosenOption.seatIndex] = guest.id
    }

    const evaluation = evaluatePlan(workingPlanner)
    if (evaluation.score > bestScore) {
      bestScore = evaluation.score
      bestPlanner = workingPlanner
    }
  }

  return bestPlanner
}

export function evaluatePlan(planner: PlannerData): PlanEvaluation {
  const guestMap = new Map(planner.guests.map((guest) => [guest.id, guest]))
  const affinityMap = buildAffinityMap(planner.affinities)
  let score = 0
  let hardConflicts = 0
  let seatedGuests = 0

  const seatedLookup = new Map<string, { tableId: string; seatIndex: number }>()

  for (const [tableId, seats] of Object.entries(planner.seating)) {
    const table = planner.tables.find((item) => item.id === tableId)
    if (!table) {
      continue
    }

    const guests = seats
      .map((guestId, seatIndex) => {
        if (!guestId) {
          return null
        }

        const guest = guestMap.get(guestId)
        if (!guest) {
          return null
        }

        seatedLookup.set(guestId, { tableId, seatIndex })
        seatedGuests += 1
        return { guest, seatIndex }
      })
      .filter(Boolean)

    for (let firstIndex = 0; firstIndex < guests.length; firstIndex += 1) {
      const first = guests[firstIndex]
      if (!first) {
        continue
      }

      for (let secondIndex = firstIndex + 1; secondIndex < guests.length; secondIndex += 1) {
        const second = guests[secondIndex]
        if (!second) {
          continue
        }

        const pairScore = getPairScore(first.guest, second.guest, affinityMap)
        score += pairScore

        const adjacentIndexes = getAdjacentIndexes(
          first.seatIndex,
          table.seatCount,
          table,
        )
        if (adjacentIndexes.includes(second.seatIndex)) {
          score += pairScore * 0.3
          if (
            first.guest.partnerId === second.guest.id ||
            second.guest.partnerId === first.guest.id
          ) {
            score += 8
          }
        }

        if (pairScore <= HARD_AVOID_SCORE) {
          hardConflicts += 1
          score -= 500
        }
      }
    }
  }

  const handledPartners = new Set<string>()
  for (const guest of planner.guests) {
    if (!guest.partnerId || handledPartners.has(guest.id)) {
      continue
    }

    handledPartners.add(guest.id)
    handledPartners.add(guest.partnerId)

    const guestSeat = seatedLookup.get(guest.id)
    const partnerSeat = seatedLookup.get(guest.partnerId)

    if (!guestSeat || !partnerSeat) {
      if (guestSeat || partnerSeat) {
        score -= 6
      }
      continue
    }

    if (guestSeat.tableId !== partnerSeat.tableId) {
      score -= 24
    }
  }

  const unseatedGuests = planner.guests.length - seatedGuests
  score -= unseatedGuests * 18

  return {
    score: Math.round(score),
    hardConflicts,
    seatedGuests,
    unseatedGuests,
  }
}
