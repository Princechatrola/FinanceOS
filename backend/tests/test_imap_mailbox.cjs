require('dotenv').config();
const tls = require('tls');

const socket = tls.connect(993, 'imap.gmail.com', { rejectUnauthorized: false }, () => {
  console.log('Connected to IMAP');
});

let buffer = '';
let step = 0;

socket.on('data', (d) => {
  buffer += d.toString();
  if (step === 0 && buffer.includes('* OK')) {
    step = 1; buffer = '';
    const cleanPass = (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '');
    socket.write(`a1 LOGIN "${process.env.EMAIL_USER}" "${cleanPass}"\r\n`);
  } else if (step === 1 && buffer.includes('a1 OK')) {
    step = 2; buffer = '';
    socket.write('a2 SELECT INBOX\r\n');
  } else if (step === 2 && buffer.includes('a2 OK')) {
    const match = buffer.match(/\*\s+(\d+)\s+EXISTS/);
    const total = match ? parseInt(match[1], 10) : 0;
    console.log(`Total messages in Inbox: ${total}`);
    step = 3; buffer = '';
    const fromId = Math.max(1, total - 4);
    socket.write(`a3 FETCH ${fromId}:${total} (BODY.PEEK[HEADER.FIELDS (SUBJECT FROM TO DATE)])\r\n`);
  } else if (step === 3 && buffer.includes('a3 OK')) {
    console.log('--- RECENT INBOX MESSAGES ---');
    console.log(buffer.trim());
    console.log('-----------------------------');
    socket.write('a4 LOGOUT\r\n');
    socket.end();
    process.exit(0);
  }
});
