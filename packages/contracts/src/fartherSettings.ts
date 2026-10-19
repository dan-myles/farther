// Tolerant on purpose: a value that fails to decode resets ALL server settings to defaults,
// so leaves are plain strings with decoding defaults; domain rules live in the web parse.
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

const StoredWorkspace = Schema.Struct({
  name: Schema.String.pipe(Schema.withDecodingDefault(Effect.succeed(""))),
  createdAt: Schema.String.pipe(Schema.withDecodingDefault(Effect.succeed(""))),
});
const Placements = Schema.Record(Schema.String, Schema.NullOr(Schema.String));

export const FartherWorkspacesSettings = Schema.Struct({
  spaces: Schema.Record(Schema.String, StoredWorkspace).pipe(
    Schema.withDecodingDefault(Effect.succeed({})),
  ),
  deleted: Schema.Record(Schema.String, Schema.Boolean).pipe(
    Schema.withDecodingDefault(Effect.succeed({})),
  ), // permanent; beats a late rename/move
  projects: Placements.pipe(Schema.withDecodingDefault(Effect.succeed({}))),
  chats: Placements.pipe(Schema.withDecodingDefault(Effect.succeed({}))),
});

export const FartherWorkspacesPatch = Schema.Struct({
  spaces: Schema.optionalKey(
    Schema.Record(
      Schema.String,
      Schema.Struct({
        name: Schema.optionalKey(Schema.String),
        createdAt: Schema.optionalKey(Schema.String),
      }),
    ),
  ),
  deleted: Schema.optionalKey(Schema.Record(Schema.String, Schema.Boolean)),
  projects: Schema.optionalKey(Placements),
  chats: Schema.optionalKey(Placements),
});

export const fartherServerSettingsFields = {
  fartherWorkspaces: FartherWorkspacesSettings.pipe(
    Schema.withDecodingDefault(Effect.succeed(Schema.decodeSync(FartherWorkspacesSettings)({}))),
  ),
};
export const fartherServerSettingsPatchFields = {
  fartherWorkspaces: Schema.optionalKey(FartherWorkspacesPatch),
};
