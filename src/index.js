const fs = require('fs');
const nodePath = require('path');
const fetch = require('node-fetch');
require('dotenv').config();
const watch = require('node-watch');
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const { json } = require('express/lib/response');

const upload = multer({ dest: 'uploads' });
const app = express();

const SYNC_OUT_DIR = process.env.SYNC_OUT_DIR;
const SYNC_IN_DIR = process.env.SYNC_IN_DIR;

console.log(`Watching ${SYNC_OUT_DIR}`);

watch(SYNC_OUT_DIR, { recursive: false }, async (evt, name) => {
  const file = fs.createReadStream(name);

  const form = new FormData();
  form.append('file', file);

  await fetch(`${process.env.REMOTE_URL}/files`, {
    method: 'POST',
    body: form,
  });

  fs.unlinkSync(name);
});

app.post('/files', upload.single('file'), (req, res, next) => {
  const { originalname, path } = req.file;
  const file = fs.readFileSync(path);
  fs.writeFileSync(nodePath.join(SYNC_IN_DIR, originalname), file);
  fs.unlinkSync(path);
  res.status(200);
  res.send('success');
});

app.listen(process.env.PORT);
