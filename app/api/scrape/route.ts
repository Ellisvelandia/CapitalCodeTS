import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import cheerio from "cheerio";

export async function GET(req: NextRequest) {
  try {
    const response = await axios.get("https://capital-code.vercel.app/");
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract relevant data from the website
    const data = {
      title: $("title").text(),
      services: $("h2").map((i, el) => $(el).text()).get().filter(service => service && !/\d/.test(service)),
      testimonials: $(".testimonial").map((i, el) => $(el).text()).get().filter(testimonial => testimonial && !/\d/.test(testimonial)),
      // Add more fields as necessary
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { error: "Failed to scrape the website." },
      { status: 500 }
    );
  }
} 