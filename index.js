require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const cors = require('cors')
const KJUR = require('jsrsasign')
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express()
const port = process.env.PORT || 4000

const corsOptions = {
  origin: '*',
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['content-type', 'authorization', 'accept', 'x-requested-with'],
  exposeHeaders: ['content-type']
}

app.use(bodyParser.json())
app.use(cors(corsOptions)) 
app.options('*', cors())

app.use('/', createProxyMiddleware({
  target: 'https://zoom-endpt.vercel.app/', 
  changeOrigin: true,
}));

app.post('/', (req, res) => {

  // res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, X-Requested-With, z-sdk-version");

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
