
SELECT m.role, m.content, m."createdAt" 
FROM "Message" m
JOIN "Conversation" c ON m."conversationId" = c.id
WHERE c."remoteId" = '555497092223'
ORDER BY m."createdAt" DESC
LIMIT 5;
