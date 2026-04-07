export type TableShape = 'round' | 'rectangle' | 'oval' | 'kids'

export interface Guest {
  id: string
  importId: string | null
  name: string
  age: number | null
  circles: string[]
  partnerId: string | null
  lockedTableId: string | null
  tags: string[]
  notes: string
}

export type AutoAssignStrategy = 'balanced' | 'social' | 'bridge' | 'strict'

export interface Room {
  id: string
  name: string
  notes: string
}

export interface Table {
  id: string
  roomId: string
  name: string
  shape: TableShape
  seatCount: number
  notes: string
}

export interface Affinity {
  id: string
  guestAId: string
  guestBId: string
  score: number
  note: string
}

export interface PlannerData {
  eventName: string
  rooms: Room[]
  tables: Table[]
  guests: Guest[]
  circles: string[]
  affinities: Affinity[]
  seating: Record<string, Array<string | null>>
}

export interface PlanEvaluation {
  score: number
  hardConflicts: number
  seatedGuests: number
  unseatedGuests: number
}
