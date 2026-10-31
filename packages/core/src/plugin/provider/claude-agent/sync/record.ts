export * as SessionRecord from "./record.js"

import { Effect, Option, Schema } from "effect"

const Checkpoint = Schema.Struct({ hash: Schema.String, claudeMessageID: Schema.optional(Schema.String) })
export type Checkpoint = typeof Checkpoint.Type
const Record = Schema.Struct({
  claudeSessionID: Schema.String,
  history: Schema.optional(Schema.Array(Checkpoint)),
  // After cancellation, Claude owns the partial reply; history ends at the input it received.
  interrupted: Schema.optional(Schema.Boolean),
  // Claude Code keeps transcripts in its config directory, so only the same directory can resume this session.
  configDir: Schema.optional(Schema.String),
})
export type Record = typeof Record.Type

export interface Storage {
  readonly get: (key: string) => Effect.Effect<unknown>
  readonly set: (key: string, value: Record) => Effect.Effect<void>
}

export function make(storage: Storage) {
  return {
    get: Effect.fn("SessionRecord.get")(function* (sessionID: string) {
      const saved = Schema.decodeUnknownOption(Record)(yield* storage.get(`sessions/${sessionID}`))
      return Option.getOrUndefined(saved)
    }),
    set: (sessionID: string, record: Record) => storage.set(`sessions/${sessionID}`, record),
  }
}
