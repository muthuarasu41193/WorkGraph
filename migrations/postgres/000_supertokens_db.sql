-- SuperTokens Core uses a separate database (auth profile).
SELECT 'CREATE DATABASE supertokens'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'supertokens')\gexec
