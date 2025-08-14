import formidable from 'formidable';
import path from 'path';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Error parsing the files' });
    }

    const fileArray = Array.isArray(files.file) ? files.file : [files.file];
    const file = fileArray[0];

    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'No file uploaded or file path missing' });
    }

  try {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = path.basename(file.filepath);
  const destPath = path.join(uploadDir, fileName);

  // Copy file from temp to destination
  await fs.promises.copyFile(file.filepath, destPath);
  // Delete the temp file after copy
  await fs.promises.unlink(file.filepath);

  const fileUrl = `/uploads/${fileName}`;
  return res.status(200).json({ url: fileUrl });
} catch (error) {
  console.error('File saving error:', error);
  return res.status(500).json({ error: 'Failed to save the file' });
}

  });
}
