import type { TableShape } from './types'

export interface GuestDraft {
  name: string
  age: string
  circle: string
  tags: string
  notes: string
}

export interface RoomDraft {
  name: string
  notes: string
}

export interface TableDraft {
  roomId: string
  name: string
  shape: TableShape
  seatCount: string
  notes: string
}

export interface AffinityDraft {
  guestAId: string
  guestBId: string
  score: string
  note: string
}

export interface GuestSeatInfo {
  tableId: string
  tableName: string
  roomName: string
  seatIndex: number
}

export const emptyGuestDraft: GuestDraft = {
  name: '',
  age: '',
  circle: '',
  tags: '',
  notes: '',
}

export const emptyRoomDraft: RoomDraft = {
  name: '',
  notes: '',
}

export const emptyAffinityDraft: AffinityDraft = {
  guestAId: '',
  guestBId: '',
  score: '40',
  note: '',
}
