// insertData.ts
import "dotenv/config"; // Load environment variables
import { createClient } from "@supabase/supabase-js";
import { services, processSteps, guarantees, contactInfo } from "./lib/data";

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
    console.log("Services inserted successfully!");

    // Insert process steps
    const { error: processError } = await supabase
      .from("process_steps")
      .insert(processSteps);
    if (processError) throw processError;
    console.log("Process steps inserted successfully!");

    // Insert guarantees
    const { error: guaranteesError } = await supabase
      .from("guarantees")
      .insert(guarantees);
    if (guaranteesError) throw guaranteesError;
    console.log("Guarantees inserted successfully!");

    // Insert contact info
    const { error: contactError } = await supabase
      .from("contact_info")
      .insert([contactInfo]);
    if (contactError) throw contactError;
    console.log("Contact info inserted successfully!");

    console.log("All data inserted successfully!");
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}

insertData();
