-- Foreign Key Verification Script
-- Run this to check current foreign key constraints and identify issues

-- 1. List all current foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name,
    rc.delete_rule,
    rc.update_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
ORDER BY tc.table_name, kcu.column_name;

-- 2. Check for missing foreign key constraints
-- (Tables that should have foreign keys but don't)

-- conversations_conversation missing constraints
SELECT 'conversations_conversation.rag_profile_id missing FK' as issue
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'conversations_conversation' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%rag_profile%'
);

SELECT 'conversations_conversation.merged_into_id missing FK' as issue
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'conversations_conversation' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%merged_into%'
);

-- agent_messages missing constraints
SELECT 'agent_messages.agent_thread_id missing FK' as issue
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'agent_messages' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%agent_thread%'
);

-- agent_threads missing constraints  
SELECT 'agent_threads.mailbox_id missing FK' as issue
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'agent_threads' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%mailbox%'
);

-- files missing constraints
SELECT 'conversations_file.message_id missing FK' as issue
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'conversations_file' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%message%'
);

SELECT 'conversations_file.note_id missing FK' as issue
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'conversations_file' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%note%'
);

-- notes missing constraints
SELECT 'conversations_note.conversation_id missing FK' as issue
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'conversations_note' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%conversation%'
);

-- 3. Check for data type mismatches
SELECT 
    'Data type mismatch: ' || t.table_name || '.' || t.column_name || 
    ' is ' || t.data_type || ' but should reference ' || 
    rt.table_name || '.' || rt.column_name || ' which is ' || rt.data_type as issue
FROM (
    -- knowledge_documents.mailbox_id (should be bigint to match mailboxes.id)
    SELECT 'knowledge_documents' as table_name, 'mailbox_id' as column_name, 
           data_type, 'mailboxes_mailbox' as ref_table, 'id' as ref_column
    FROM information_schema.columns 
    WHERE table_name = 'knowledge_documents' AND column_name = 'mailbox_id'
) t
JOIN (
    SELECT 'mailboxes_mailbox' as table_name, 'id' as column_name, data_type
    FROM information_schema.columns 
    WHERE table_name = 'mailboxes_mailbox' AND column_name = 'id'
) rt ON t.ref_table = rt.table_name AND t.ref_column = rt.column_name
WHERE t.data_type != rt.data_type;

-- 4. Check for orphaned records that would prevent FK creation
-- Conversations with invalid mailbox_id
SELECT 
    COUNT(*) as orphaned_conversations,
    'conversations with invalid mailbox_id' as description
FROM conversations_conversation cc
WHERE NOT EXISTS (
    SELECT 1 FROM mailboxes_mailbox mm 
    WHERE mm.id = cc.mailbox_id
);

-- Messages with invalid conversation_id
SELECT 
    COUNT(*) as orphaned_messages,
    'messages with invalid conversation_id' as description  
FROM messages m
WHERE NOT EXISTS (
    SELECT 1 FROM conversations_conversation cc 
    WHERE cc.id = m.conversation_id
);

-- Agent messages with invalid thread_id
SELECT 
    COUNT(*) as orphaned_agent_messages,
    'agent_messages with invalid agent_thread_id' as description
FROM agent_messages am
WHERE agent_thread_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM agent_threads at 
    WHERE at.id = am.agent_thread_id
);

-- 5. Check foreign key cascade rules
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'NO ACTION' THEN 'Consider CASCADE or SET NULL'
        WHEN rc.delete_rule = 'RESTRICT' THEN 'Consider CASCADE or SET NULL'
        ELSE 'OK'
    END as recommendation
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name  
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- 6. Summary of tables and their foreign key status
WITH table_fk_count AS (
    SELECT 
        t.table_name,
        COUNT(tc.constraint_name) as fk_count
    FROM information_schema.tables t
    LEFT JOIN information_schema.table_constraints tc 
        ON t.table_name = tc.table_name 
        AND tc.constraint_type = 'FOREIGN KEY'
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'django_%'
    AND t.table_name NOT LIKE 'auth_%' 
    AND t.table_name NOT LIKE 'account_%'
    AND t.table_name NOT LIKE 'socialaccount_%'
    GROUP BY t.table_name
)
SELECT 
    table_name,
    fk_count,
    CASE 
        WHEN fk_count = 0 THEN 'No foreign keys - review needed'
        WHEN fk_count < 2 THEN 'Few foreign keys - may need more'
        ELSE 'Has foreign keys'
    END as status
FROM table_fk_count
ORDER BY fk_count, table_name;