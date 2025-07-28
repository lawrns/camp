create or replace function increment_usage_count (doc_id int)
returns void as $$
  update knowledge_documents
  set usage_count = usage_count + 1,
      updated_at = now()
  where id = doc_id;
$$ language sql; 