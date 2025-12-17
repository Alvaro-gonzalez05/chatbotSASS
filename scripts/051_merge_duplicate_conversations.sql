-- Función para fusionar conversaciones duplicadas (mismo número con/sin prefijo)
-- Esta función busca conversaciones del mismo bot donde los números de teléfono coinciden parcialmente
-- (ej: 261... y 549261...) y las fusiona en una sola, moviendo los mensajes.

CREATE OR REPLACE FUNCTION merge_duplicate_conversations()
RETURNS TABLE (merged_count INTEGER, messages_moved INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    duplicate_record RECORD;
    keep_id UUID;
    remove_id UUID;
    moved_count INTEGER := 0;
    total_merged INTEGER := 0;
    current_moved INTEGER;
BEGIN
    -- Iterar sobre pares de conversaciones que parecen ser la misma persona
    FOR duplicate_record IN
        SELECT DISTINCT ON (least(c1.id::text, c2.id::text))
            c1.id as id1, c1.client_phone as phone1, c1.client_id as client_id1,
            c2.id as id2, c2.client_phone as phone2, c2.client_id as client_id2
        FROM conversations c1
        JOIN conversations c2 ON c1.bot_id = c2.bot_id AND c1.id != c2.id
        WHERE
            -- Asegurar longitud mínima para evitar falsos positivos
            length(c1.client_phone) >= 7 AND length(c2.client_phone) >= 7
            AND (
                -- Caso 1: phone1 está contenido al final de phone2
                (length(c1.client_phone) < length(c2.client_phone) AND c2.client_phone LIKE '%' || c1.client_phone)
                OR
                -- Caso 2: phone2 está contenido al final de phone1
                (length(c2.client_phone) < length(c1.client_phone) AND c1.client_phone LIKE '%' || c2.client_phone)
            )
    LOOP
        -- Decidir cuál conservar
        -- Preferimos SIEMPRE el número más largo (formato internacional con prefijo 549...)
        -- Si el número corto tenía el cliente vinculado, lo movemos al largo.
        
        IF length(duplicate_record.phone1) > length(duplicate_record.phone2) THEN
            keep_id := duplicate_record.id1;
            remove_id := duplicate_record.id2;
            
            -- Si el que vamos a borrar tenía cliente y el que guardamos no, transferimos el cliente
            IF duplicate_record.client_id2 IS NOT NULL AND duplicate_record.client_id1 IS NULL THEN
                UPDATE conversations SET client_id = duplicate_record.client_id2 WHERE id = keep_id;
            END IF;
        ELSE
            keep_id := duplicate_record.id2;
            remove_id := duplicate_record.id1;
            
            -- Si el que vamos a borrar tenía cliente y el que guardamos no, transferimos el cliente
            IF duplicate_record.client_id1 IS NOT NULL AND duplicate_record.client_id2 IS NULL THEN
                UPDATE conversations SET client_id = duplicate_record.client_id1 WHERE id = keep_id;
            END IF;
        END IF;

        -- Mover mensajes de la conversación a eliminar hacia la que conservamos
        UPDATE messages
        SET conversation_id = keep_id
        WHERE conversation_id = remove_id;
        
        GET DIAGNOSTICS current_moved = ROW_COUNT;
        moved_count := moved_count + current_moved;

        -- Eliminar conversación duplicada
        DELETE FROM conversations WHERE id = remove_id;
        
        total_merged := total_merged + 1;
    END LOOP;

    RETURN QUERY SELECT total_merged, moved_count;
END;
$$;
