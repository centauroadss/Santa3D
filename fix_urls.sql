UPDATE videos SET url = CONCAT('https://santa3d.sfo3.digitaloceanspaces.com/', storageKey) WHERE status = 'VALIDATED' AND url IS NULL;
