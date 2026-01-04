SELECT v.id, p.instagram, v.uploadedAt, v.status FROM videos v JOIN participants p ON v.participantId = p.id WHERE v.status = 'PENDING_VALIDATION' ORDER BY v.uploadedAt DESC LIMIT 10;
