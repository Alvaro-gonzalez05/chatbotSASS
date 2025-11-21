
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching conversations:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]))
  } else {
    console.log('No data found, cannot infer columns easily via select *')
    // Try to insert a dummy row to see error or just assume we need to add it if we can't see it.
    // Actually, I can just try to select 'paused_until' specifically.
    const { error: colError } = await supabase
      .from('conversations')
      .select('paused_until')
      .limit(1)
    
    if (colError) {
        console.log('paused_until column likely missing:', colError.message)
    } else {
        console.log('paused_until column exists')
    }
  }
}

checkColumns()
