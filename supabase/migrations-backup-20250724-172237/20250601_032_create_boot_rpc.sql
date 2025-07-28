create or replace function public.get_dashboard_boot(_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  _profile  profiles%rowtype;
  _org      organizations%rowtype;
  _convos   jsonb;
begin
  select * into _profile from profiles where id = _user_id;
  select * into _org
    from organizations o join organization_members m on m.organization_id=o.id
   where m.user_id=_user_id limit 1;

  _convos := (select jsonb_agg(c.*) from conversations c where c.organization_id=_org.id order by inserted_at desc limit 10);

  return jsonb_build_object(
    'profile',     row_to_json(_profile),
    'organization',row_to_json(_org),
    'conversations', _convos
  );
end;
$$;