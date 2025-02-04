// insertData.ts

import { createClient } from "@supabase/supabase-js";
import { services, processSteps, guarantees, contactInfo } from "../data/data";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function insertData() {
  try {
    // Insert services
    const { error: servicesError } = await supabase
      .from("services")
      .insert(services);
    if (servicesError) throw servicesError;

    // Insert process steps
    const { error: processError } = await supabase
      .from("process_steps")
      .insert(processSteps);
    if (processError) throw processError;

    // Insert guarantees
    const { error: guaranteesError } = await supabase
      .from("guarantees")
      .insert(guarantees);
    if (guaranteesError) throw guaranteesError;

    // Insert contact info
    const { error: contactError } = await supabase
      .from("contact_info")
      .insert([contactInfo]);
    if (contactError) throw contactError;

    console.log("Data inserted successfully!");
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}

insertData();
