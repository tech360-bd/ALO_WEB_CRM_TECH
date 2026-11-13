-- Reuse the existing canonical AI workforce run history; no new chat database,
-- no synthetic agents, no destructive changes and no history deletion.
CREATE INDEX `AwfRun_owner_chat_history_idx` ON `AwfRun` (`actorUserId`, `trigger`, `startedAt`);
CREATE INDEX `AwfRun_chat_rate_idx` ON `AwfRun` (`trigger`, `provider`, `model`, `startedAt`);
