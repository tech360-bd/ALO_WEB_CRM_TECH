-- Conflict evidence contains multiple source URLs, labels and values as JSON;
-- VARCHAR(191) truncates valid conflict records. Preserve the empty-array
-- default while moving the serialized payload to long text.
ALTER TABLE `DataConflict`
  MODIFY `conflictingValues` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]');
