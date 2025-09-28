-- Diagnostic user deletion script with detailed failure reporting
-- This will tell us exactly where the deletion process fails

-- Target user details
-- User ID: 8f2a11f0-89d8-4a6b-82ab-c80a02beae13
-- Email: mauricio.perez2@bestbuy.com

DO $$
DECLARE
    target_user_id UUID := '8f2a11f0-89d8-4a6b-82ab-c80a02beae13';
    user_email TEXT := 'mauricio.perez2@bestbuy.com';
    step_name TEXT;
    records_deleted INTEGER;
    total_deleted INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 [DIAGNOSTIC] Starting diagnostic deletion for user: % (%)', target_user_id, user_email;
    
    -- Step 1: Check if user exists
    step_name := 'Check user existence';
    RAISE NOTICE '📋 [STEP] %', step_name;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE NOTICE '✅ [RESULT] User does not exist - already deleted!';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ [RESULT] User exists, proceeding with deletion';
    
    -- Disable triggers temporarily
    step_name := 'Disable triggers';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        SET session_replication_role = replica;
        RAISE NOTICE '✅ [RESULT] Triggers disabled successfully';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 2: Delete conversation_embeddings
    step_name := 'Delete conversation_embeddings';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM conversation_embeddings 
        WHERE organization_id IN (
            SELECT id FROM organizations WHERE owner_id = target_user_id
        );
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % conversation_embeddings records', records_deleted;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ [WARNING] conversation_embeddings table does not exist, skipping';
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 3: Delete business_documents
    step_name := 'Delete business_documents';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM business_documents 
        WHERE user_id = target_user_id
           OR organization_id IN (
             SELECT id FROM organizations WHERE owner_id = target_user_id
           );
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % business_documents records', records_deleted;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ [WARNING] business_documents table does not exist, skipping';
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 4: Delete team_invitations
    step_name := 'Delete team_invitations';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM team_invitations 
        WHERE invited_by = target_user_id
           OR organization_id IN (
             SELECT id FROM organizations WHERE owner_id = target_user_id
           );
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % team_invitations records', records_deleted;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ [WARNING] team_invitations table does not exist, skipping';
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 5: Delete team_members
    step_name := 'Delete team_members';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM team_members 
        WHERE user_id = target_user_id
           OR organization_id IN (
             SELECT id FROM organizations WHERE owner_id = target_user_id
           );
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % team_members records', records_deleted;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ [WARNING] team_members table does not exist, skipping';
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 6: Delete agents
    step_name := 'Delete agents';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM agents 
        WHERE user_id = target_user_id
           OR organization_id IN (
             SELECT id FROM organizations WHERE owner_id = target_user_id
           );
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % agents records', records_deleted;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ [WARNING] agents table does not exist, skipping';
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 7: Delete user_subscriptions
    step_name := 'Delete user_subscriptions';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM user_subscriptions 
        WHERE user_id = target_user_id
           OR organization_id IN (
             SELECT id FROM organizations WHERE owner_id = target_user_id
           );
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % user_subscriptions records', records_deleted;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ [WARNING] user_subscriptions table does not exist, skipping';
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 8: Delete business_info_fields
    step_name := 'Delete business_info_fields';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM business_info_fields 
        WHERE organization_id IN (
            SELECT id FROM organizations WHERE owner_id = target_user_id
        );
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % business_info_fields records', records_deleted;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ [WARNING] business_info_fields table does not exist, skipping';
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 9: Delete vibe_cards (if exists)
    step_name := 'Delete vibe_cards';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM vibe_cards 
        WHERE organization_id IN (
            SELECT id FROM organizations WHERE owner_id = target_user_id
        );
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % vibe_cards records', records_deleted;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ [WARNING] vibe_cards table does not exist, skipping';
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 10: Delete setup_completion (if exists)
    step_name := 'Delete setup_completion';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM setup_completion 
        WHERE organization_id IN (
            SELECT id FROM organizations WHERE owner_id = target_user_id
        );
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % setup_completion records', records_deleted;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ [WARNING] setup_completion table does not exist, skipping';
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 11: Delete offers (if exists)
    step_name := 'Delete offers';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM offers 
        WHERE organization_id IN (
            SELECT id FROM organizations WHERE owner_id = target_user_id
        );
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % offers records', records_deleted;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '⚠️ [WARNING] offers table does not exist, skipping';
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 12: Delete organizations
    step_name := 'Delete organizations';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM organizations WHERE owner_id = target_user_id;
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % organizations records', records_deleted;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '❌ [CRITICAL] organizations table does not exist! This is the root cause!';
            RETURN;
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Step 13: Delete the user
    step_name := 'Delete auth.users';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        DELETE FROM auth.users WHERE id = target_user_id;
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        total_deleted := total_deleted + records_deleted;
        RAISE NOTICE '✅ [RESULT] Deleted % auth.users records', records_deleted;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
            RETURN;
    END;
    
    -- Re-enable triggers
    step_name := 'Re-enable triggers';
    RAISE NOTICE '📋 [STEP] %', step_name;
    BEGIN
        SET session_replication_role = DEFAULT;
        RAISE NOTICE '✅ [RESULT] Triggers re-enabled successfully';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING '❌ [ERROR] Failed at step "%": SQLSTATE=%, SQLERRM=%', step_name, SQLSTATE, SQLERRM;
    END;
    
    -- Final verification
    step_name := 'Verify deletion';
    RAISE NOTICE '📋 [STEP] %', step_name;
    
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE WARNING '❌ [FINAL] User still exists after deletion attempt!';
    ELSE
        RAISE NOTICE '🎉 [SUCCESS] User successfully deleted! Total records removed: %', total_deleted;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '💥 [FATAL ERROR] Unexpected error in main block: SQLSTATE=%, SQLERRM=%', SQLSTATE, SQLERRM;
        -- Try to re-enable triggers even if something went wrong
        BEGIN
            SET session_replication_role = DEFAULT;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '⚠️ [WARNING] Could not re-enable triggers after fatal error';
        END;
END $$;
