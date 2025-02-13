
CREATE OR REPLACE FUNCTION create_chat_with_message(
  p_user_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_role TEXT,
  p_type TEXT,
  p_metadata JSONB
) RETURNS TABLE (
  chat_id UUID,
  message_id UUID
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_chat_id UUID;
  v_message_id UUID;
BEGIN
  -- Create chat
  INSERT INTO chats (user_id, title)
  VALUES (p_user_id, p_title)
  RETURNING id INTO v_chat_id;

  -- Create message
  INSERT INTO messages (chat_id, content, role, type, metadata)
  VALUES (v_chat_id, p_content, p_role, p_type, p_metadata)
  RETURNING id INTO v_message_id;

  RETURN QUERY SELECT v_chat_id, v_message_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_chat_with_message TO authenticated;
