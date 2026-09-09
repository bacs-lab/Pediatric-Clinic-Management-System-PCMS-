insert into public.clinics (id, name, status)
values ('00000000-0000-4000-8000-000000000001', 'PCMS Synthetic Clinic', 'active')
on conflict (id) do nothing;
