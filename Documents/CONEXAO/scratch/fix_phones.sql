
UPDATE "Contact" 
SET phone = '55' || SUBSTRING(phone FROM 1 FOR 2) || '9' || SUBSTRING(phone FROM 3)
WHERE phone NOT LIKE '55%' AND phone NOT LIKE 'SIM_%' AND LENGTH(phone) = 10;

UPDATE "Contact"
SET phone = '55' || phone
WHERE phone NOT LIKE '55%' AND phone NOT LIKE 'SIM_%' AND LENGTH(phone) = 11;

UPDATE "Conversation"
SET "remoteId" = '55' || SUBSTRING("remoteId" FROM 1 FOR 2) || '9' || SUBSTRING("remoteId" FROM 3)
WHERE "remoteId" NOT LIKE '55%' AND "remoteId" NOT LIKE 'SIM_%' AND LENGTH("remoteId") = 10;

UPDATE "Conversation"
SET "remoteId" = '55' || "remoteId"
WHERE "remoteId" NOT LIKE '55%' AND "remoteId" NOT LIKE 'SIM_%' AND LENGTH("remoteId") = 11;
