-- Test script to check if required tables exist
SELECT 
  'products' as table_name,
  COUNT(*) as exists
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'products'

UNION ALL

SELECT 
  'orders' as table_name,
  COUNT(*) as exists
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'orders'

UNION ALL

SELECT 
  'reservations' as table_name,
  COUNT(*) as exists
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'reservations';