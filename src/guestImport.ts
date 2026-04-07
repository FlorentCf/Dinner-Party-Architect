import { parseTagString } from './planUtils'

export interface ImportedGuestDraft {
  importId: string
  name: string
  age: number | null
  circle: string
  tags: string[]
  notes: string
  partnerName: string
  partnerImportId: string
  lockedTableName: string
}

export interface GuestImportResult {
  guests: ImportedGuestDraft[]
  skippedRows: number
}

const headerAliases = {
  importId: ['id', 'guestid', 'inviteid', 'importid'],
  name: ['name', 'guest', 'invite', 'invité', 'prenom', 'prénom', 'nom'],
  age: ['age', 'âge'],
  circle: ['circle', 'group', 'groupe', 'family', 'famille', 'side', 'cote', 'côté'],
  tags: ['tags', 'tag', 'labels', 'categories', 'catégories'],
  notes: ['notes', 'note', 'comment', 'comments', 'commentaire', 'remarque'],
  partnerName: ['partnername', 'couple', 'conjointname', 'conjointnom', 'spouse'],
  partnerImportId: ['partner', 'partnerid', 'partnerimportid', 'conjointid'],
  lockedTableName: ['table', 'lockedtable', 'fixedtable', 'tablefixe', 'assignedtable'],
}

type HeaderKey = keyof typeof headerAliases

function detectDelimiter(line: string) {
  const candidates = [',', ';', '\t']
  return candidates
    .map((delimiter) => ({
      delimiter,
      count: splitDelimitedLine(line, delimiter).length,
    }))
    .sort((first, second) => second.count - first.count)[0].delimiter
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function getHeaderKey(value: string): HeaderKey | null {
  const normalizedValue = normalizeHeader(value)

  for (const [key, aliases] of Object.entries(headerAliases)) {
    if (aliases.map(normalizeHeader).includes(normalizedValue)) {
      return key as HeaderKey
    }
  }

  return null
}

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = []
  let currentCell = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"' && nextCharacter === '"') {
      currentCell += '"'
      index += 1
      continue
    }

    if (character === '"') {
      insideQuotes = !insideQuotes
      continue
    }

    if (character === delimiter && !insideQuotes) {
      cells.push(currentCell.trim())
      currentCell = ''
      continue
    }

    currentCell += character
  }

  cells.push(currentCell.trim())
  return cells
}

function parseAge(value: string) {
  const age = Number.parseInt(value.trim(), 10)
  return Number.isFinite(age) ? Math.max(0, Math.min(120, age)) : null
}

function parseTags(value: string) {
  return parseTagString(value.replace(/[|/]+/g, ','))
}

function rowToGuest(
  cells: string[],
  indexes: Partial<Record<HeaderKey, number>>,
): ImportedGuestDraft | null {
  const name = cells[indexes.name ?? 0]?.trim() ?? ''

  if (!name) {
    return null
  }

  return {
    importId:
      indexes.importId === undefined ? '' : cells[indexes.importId]?.trim() ?? '',
    name,
    age: indexes.age === undefined ? null : parseAge(cells[indexes.age] ?? ''),
    circle: indexes.circle === undefined ? '' : cells[indexes.circle]?.trim() ?? '',
    tags: indexes.tags === undefined ? [] : parseTags(cells[indexes.tags] ?? ''),
    notes: indexes.notes === undefined ? '' : cells[indexes.notes]?.trim() ?? '',
    partnerName:
      indexes.partnerName === undefined
        ? ''
        : cells[indexes.partnerName]?.trim() ?? '',
    partnerImportId:
      indexes.partnerImportId === undefined
        ? ''
        : cells[indexes.partnerImportId]?.trim() ?? '',
    lockedTableName:
      indexes.lockedTableName === undefined
        ? ''
        : cells[indexes.lockedTableName]?.trim() ?? '',
  }
}

function buildHeaderIndexes(cells: string[]) {
  const indexes: Partial<Record<HeaderKey, number>> = {}

  cells.forEach((cell, index) => {
    const key = getHeaderKey(cell)
    if (key && indexes[key] === undefined) {
      indexes[key] = index
    }
  })

  return indexes
}

export function parseGuestImport(text: string): GuestImportResult {
  const rows = text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)

  if (rows.length === 0) {
    return {
      guests: [],
      skippedRows: 0,
    }
  }

  const delimiter = detectDelimiter(rows[0])
  const firstRowCells = splitDelimitedLine(rows[0], delimiter)
  const headerIndexes = buildHeaderIndexes(firstRowCells)
  const hasHeader = headerIndexes.name !== undefined
  const indexes = hasHeader
    ? headerIndexes
    : {
        name: 0,
        age: 1,
        circle: 2,
        tags: 3,
        notes: 4,
        partnerName: 5,
        lockedTableName: 6,
      }

  const dataRows = hasHeader ? rows.slice(1) : rows
  let skippedRows = 0
  const guests: ImportedGuestDraft[] = []

  for (const row of dataRows) {
    const cells = splitDelimitedLine(row, delimiter)
    const guest = rowToGuest(cells, indexes)

    if (!guest) {
      skippedRows += 1
      continue
    }

    guests.push(guest)
  }

  return {
    guests,
    skippedRows,
  }
}
