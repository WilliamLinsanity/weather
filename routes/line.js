require('dotenv').config();

const express = require('express');
const moment = require('moment');
const router = express.Router();

const line = require('@line/bot-sdk');
let userId = ''
const app = express();
// body parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
const request = require('request');
const rp = require('request-promise');
// create LINE SDK client
const client = new line.Client({
  channelId: process.env['CHANNEL_ID'],
  channelAccessToken: process.env['CHANNEL_ACCESS_TOKEN'],
  channelSecret: process.env['CHANNEL_SECRET']
});
const config = {
  channelAccessToken: process.env['CHANNEL_ACCESS_TOKEN'],
  channelSecret: process.env['CHANNEL_SECRET']
};

// for line develop test
router.get('/', (req, res) => res.end(`I'm listening. Please access with POST.`));


router.post('/', (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.log(err)
      res.status(500).end();
    });
});

// event handler
function handleEvent(event) {
  if (event.replyToken && event.replyToken.match(/^(.)\1*$/)) {
    return console.log('Test hook recieved: ' + JSON.stringify(event.message));
  }
  userId = event.source.userId
  console.log(userId)
  client.getProfile(userId)
    .then((profile) => {
      let db = admin.database();
      let ref = db.ref(userId).set({
        name: encodeURIComponent(profile.displayName),
        img: profile.pictureUrl,
        status: encodeURIComponent(profile.statusMessage),
        location: encodeURIComponent('預設地區')
      });
    })
    .catch((err) => {
     console.log(err,'error')
    });
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

async function handleText(message, replyToken, source) {
  switch (message.text) {
    case 'test1':
      return client.replyMessage(replyToken, {type: 'text', text: message.text});
    default:
      rp({uri:`https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${weatherToken}&locationName=${encodeURIComponent(message.text)}`,json:true}).then(function(res){
        const weather = res.records.location[0].weatherElement
        return client.replyMessage(replyToken, [
          {
            "type": "flex",
            "altText": `${message.text}天氣`,
            "contents":
              {
                "type": "bubble",
                "body": {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "text",
                      "text": `${message.text}天氣`,
                      "weight": "bold",
                      "size": "lg",
                      "position": "relative",
                      "align": "center",
                      "color":"#0080FF"
                    },
                    {
                      "type": "box",
                      "layout": "vertical",
                      "margin": "lg",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "天氣",
                          "size": "md",
                          "weight": "bold",
                          "color":"#0080FF"
                        },
                        {
                          "type": "box",
                          "layout": "baseline",
                          "spacing": "sm",
                          "contents": [
                            {
                              "type": "text",
                              "text": `${moment(weather[0].time[0].startTime).format("MM-DD")} 白天`,
                              "color": "#aaaaaa",
                              "size": "sm",
                              "flex": 5
                            },
                            {
                              "type": "text",
                              "text": `${weather[0].time[0].parameter.parameterName}`,
                              "wrap": true,
                              "color": "#666666",
                              "size": "sm",
                              "flex": 3
                            }
                          ],
                        },
                        {
                          "type": "box",
                          "layout": "baseline",
                          "spacing": "sm",
                          "contents": [
                            {
                              "type": "text",
                              "text": `${moment(weather[0].time[2].startTime).format("MM-DD")} 晚上`,
                              "color": "#aaaaaa",
                              "size": "sm",
                              "flex": 5
                            },
                            {
                              "type": "text",
                              "text": `${weather[0].time[2].parameter.parameterName}`,
                              "wrap": true,
                              "color": "#666666",
                              "size": "sm",
                              "flex": 3
                            }
                          ],
                        },
                        {
                          "type": "text",
                          "text": "氣溫",
                          "size": "md",
                          "weight": "bold",
                          "color":"#0080FF"
                        },
                        {
                          "type": "box",
                          "layout": "baseline",
                          "spacing": "sm",
                          "contents": [
                            {
                              "type": "text",
                              "text": `${moment(weather[2].time[0].startTime).format("MM-DD")} 白天`,
                              "color": "#aaaaaa",
                              "size": "sm",
                              "flex": 5
                            },
                            {
                              "type": "text",
                              "text": `${weather[2].time[0].parameter.parameterName}${weather[2].time[0].parameter.parameterUnit} - ${weather[4].time[0].parameter.parameterName}${weather[4].time[0].parameter.parameterUnit}`,
                              "wrap": true,
                              "color": "#666666",
                              "size": "sm",
                              "flex": 3
                            }
                          ],
                        },
                        {
                          "type": "box",
                          "layout": "baseline",
                          "spacing": "sm",
                          "contents": [
                            {
                              "type": "text",
                              "text": `${moment(weather[2].time[2].startTime).format("MM-DD")} 晚上`,
                              "color": "#aaaaaa",
                              "size": "sm",
                              "flex": 5
                            },
                            {
                              "type": "text",
                              "text": `${weather[2].time[2].parameter.parameterName}${weather[2].time[2].parameter.parameterUnit} - ${weather[4].time[2].parameter.parameterName}${weather[4].time[2].parameter.parameterUnit}`,
                              "wrap": true,
                              "color": "#666666",
                              "size": "sm",
                              "flex": 3
                            }
                          ],
                        },
                      ]
                    }
                  ]
                }
              }
          }]);
      }).catch((error)=>{
        console.log(error)
        return client.replyMessage(replyToken, {type: 'text', text: message.text});
      });
  }
}

module.exports = router;

// set timezone
process.env.TZ = 'Asia/Taipei';

// firebase
let admin = require('firebase-admin');
var serviceAccount = require('../firebase-admin.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://weather-4d605.firebaseio.com/'
});
const weatherRef =admin.database().ref()
// line
app.post('/line/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => {
      res.json(result)
    })
    .catch((err) => {
      res.status(500).end();
    });

});

const weatherToken = 'CWB-88D06302-5081-4A40-BD5D-2CCD4CDBEDF4'; // 氣象局的token

// cross domain config
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');

  next();
})
// listen on port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
