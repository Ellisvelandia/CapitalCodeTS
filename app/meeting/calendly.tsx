"use client";

import { InlineWidget } from "react-calendly";
import styles from "./calendly.module.css";

const Calendly = () => {
  // Calendly configuration options
  const calendlyConfig = {
    // Replace this URL with your actual Calendly scheduling URL
    url: "https://calendly.com/d/cnkh-8h4-3hp/agenda-reunion",
    styles: {
      height: "700px",
      minWidth: "320px",
    },
    prefill: {
      email: "",
      firstName: "",
      lastName: "",
      name: "",
    },
    pageSettings: {
      backgroundColor: "ffffff",
      hideEventTypeDetails: false,
      hideLandingPageDetails: false,
      primaryColor: "3d80d7",
      textColor: "121212",
    },
  };

  return (
    <div className={styles.calendlyContainer}>
      <InlineWidget
        url={calendlyConfig.url}
        styles={calendlyConfig.styles}
        prefill={calendlyConfig.prefill}
        pageSettings={calendlyConfig.pageSettings}
      />
    </div>
  );
};

export default Calendly;
