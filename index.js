require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const cors = require('cors')
const KJUR = require('jsrsasign')
// const { createProxyMiddleware } =   require('http-proxy-middleware');

const app = express()
const port = process.env.PORT || 4000

const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
};

app.use(bodyParser.json())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
})
  
app.use(cors(corsOptions)) 
app.options('*', cors())

// app.use('/', createProxyMiddleware({
//   target: 'https://zoom-endpt.vercel.app/', 
//   changeOrigin: true,
// }));

app.options('/', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
  res.status(200).end();
});

app.post('/', (req, res) => {
  try {
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2

    const oHeader = { alg: 'HS256', typ: 'JWT' }

    const oPayload = {
      sdkKey: process.env.ZOOM_MEETING_SDK_KEY,
      mn: req.body.meetingNumber,
      role: req.body.role,
      iat: iat,
      exp: exp,
      appKey: process.env.ZOOM_MEETING_SDK_KEY,
      tokenExp: iat + 60 * 60 * 2
    }

    const sHeader = JSON.stringify(oHeader)
    const sPayload = JSON.stringify(oPayload)
    const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_MEETING_SDK_SECRET)
    
    res.json({
      signature: signature
    });

  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.listen(port, () => console.log(`Zoom Meeting SDK Auth Endpoint Sample Node.js listening on port ${port}!`))
