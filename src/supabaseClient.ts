import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxjppgymqevvkwkijbmw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4anBwZ3ltcWV2dmt3a2lqYm13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjc3NjQwNSwiZXhwIjoyMDU4MzUyNDA1fQ.Mire_QTCViFMQmHSlHzrIccR8nsr4-yne2Z8li5vAiw';
export const supabase = createClient(supabaseUrl, supabaseKey);
