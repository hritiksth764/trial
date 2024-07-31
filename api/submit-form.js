import { google } from "googleapis";
import formidable from "formidable";
import { Storage } from "@google-cloud/storage";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, so formidable can handle it
  },
};

export default async (req, res) => {
  if (req.method === "POST") {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: "Failed to process form data" });
        return;
      }

      try {
        // Initialize Google Cloud Storage
        const storage = new Storage({
          credentials: JSON.parse(process.env.GOOGLE_CLOUD_STORAGE_CREDENTIALS),
        });
        const bucketName = process.env.GCS_BUCKET_NAME;
        const bucket = storage.bucket(bucketName);

        // Upload Signature
        const signatureFile = files.signature;
        const signatureFilename = `signatures/${Date.now()}-${
          signatureFile.originalFilename
        }`;
        await bucket.upload(signatureFile.filepath, {
          destination: signatureFilename,
          public: true, // Make the file publicly accessible
        });
        const signatureUrl = `https://storage.googleapis.com/${bucketName}/${signatureFilename}`;

        // Upload Company Seal
        const sealFile = files.company_seal;
        const sealFilename = `seals/${Date.now()}-${sealFile.originalFilename}`;
        await bucket.upload(sealFile.filepath, {
          destination: sealFilename,
          public: true, // Make the file publicly accessible
        });
        const sealUrl = `https://storage.googleapis.com/${bucketName}/${sealFilename}`;

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
            fields.brand_name,
            fields.legal_entity,
            fields.dob,
            fields.phone,
            fields.email,
            fields.category,
            fields.area,
            fields.fit_out,
            fields.preferences,
            signatureUrl,
            sealUrl,
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
