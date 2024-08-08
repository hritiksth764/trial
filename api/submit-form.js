import { google } from "googleapis";
import { IncomingForm } from "formidable";
import { Storage } from "@google-cloud/storage";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, so formidable can handle it
  },
};

export default async (req, res) => {
  if (req.method === "POST") {
    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form:", err);
        res.status(500).json({ error: "Failed to process form data" });
        return;
      }

      try {
        console.log("Parsed fields:", fields);
        console.log("Parsed files:", files);

        // Initialize Google Cloud Storage
        const storage = new Storage({
          credentials: JSON.parse(process.env.GOOGLE_CLOUD_STORAGE_CREDENTIALS),
        });
        const bucketName = process.env.GCS_BUCKET_NAME;
        const bucket = storage.bucket(bucketName);

        // Append data to Google Sheets
        const auth = new google.auth.GoogleAuth({
          credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        const spreadsheetId = process.env.SPREADSHEET_ID;
        const range = "Sheet1!A1"; // Specify your desired range here

        const values = [
          [
            fields.name[0], // Updated field name
            fields.phone_number[0], // Updated field name
            fields.email[0], // Updated field name
            fields.project_of_interest[0], // Updated field name
            fields.enquiry_details[0], // Updated field name
            fields.house_formats.join(", "), // Assuming multiple checkboxes
            fields.location.join(", "), // Assuming multiple checkboxes
            // fields.expression_of_interest.join(", "), // Assuming multiple checkboxes
          ],
        ];

        const resource = { values };
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          resource,
        });

        res.status(200).json({ message: "Form data submitted successfully" });
      } catch (error) {
        console.error("Error processing form:", error);
        res.status(500).json({ error: "Failed to submit form data" });
      }
    });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
