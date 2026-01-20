
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Attempting to insert a test farmer as 'anon'...");

  const testFarmer = {
    full_name: "Test Farmer Anon",
    phone_number: "08012345678",
    primary_crop: "Maize",
    district: "Okuta",
    verified: false,
    created_by: null // simulating unauthenticated admin
  };

  const { data, error } = await supabase
    .from('farmers')
    .insert([testFarmer])
    .select();

  if (error) {
    console.error("Insert failed:", error);
    
    // Check if we can read
    console.log("Attempting to read farmers...");
    const { data: readData, error: readError } = await supabase.from('farmers').select('*').limit(1);
    if (readError) {
        console.error("Read failed:", readError);
    } else {
        console.log("Read successful, count:", readData.length);
    }

  } else {
    console.log("Insert successful:", data);
  }
}

testInsert();
