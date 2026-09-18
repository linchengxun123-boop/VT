-- Display-copy migration only. Safe to reapply; preserves IDs, durations and user records.
begin;
update public.training_plans set name = '微调与精准控枪训练' where id = 'C';
update public.training_tasks set name = '乱斗' where id in ('a-dm', 'c-dm');
update public.training_tasks set name = '戍卫乱斗',
  description = '使用戍卫，避免乱扫，优先单点和爆头。' where id = 'b-guardian';
update public.training_tasks set name = '微调训练' where id = 'c-micro';
commit;
