import { google } from "googleapis";

export default async (req, res) => {
  if (req.method === "POST") {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.SPREADSHEET_ID;
      const range = "Sheet1!A1"; // Change this to your desired range

      const values = [
        [
          req.body.brand_name,
          req.body.legal_entity,
          req.body.dob,
          req.body.phone,
          req.body.email,
          req.body.category,
          req.body.area,
          req.body.fit_out,
          req.body.preferences,
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
      res.status(500).json({ error: "Failed to submit form data" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
