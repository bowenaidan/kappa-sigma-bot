var HTTPS = require('https');
var botID = process.env.BOT_ID;

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      helloCheck = /^\/hello$/;
      dateCheck = /^\/date$/;
      soberMonitor = /^\/sober monitor$/;
  if(request.text && helloCheck.test(request.text)) {
    this.res.writeHead(200);
    postMessage(1);
    this.res.end();
  }
  else if(request.text && dateCheck.test(request.text)) {
    this.res.writeHead(200);
    postMessage(3);
    this.res.end();
  }
  else if(request.text && soberMonitor.test(request.text)) {
    this.res.writeHead(200);
    postMessage(4);
    this.res.end();
  }
  else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

var fs = require("fs");

const reader = require('xlsx');

function postMessage(commandNumber) {
  var botResponse, options, body, botReq;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  if(commandNumber == 1) //basic hello world test to make sure bot is listening
  {
    botResponse = "Hello";
    console.log(botResponse);
    body = {
      "bot_id" : botID,
      "text" : botResponse
    };
  }
  else if(commandNumber == 3) //this function tests that the date returns the correct values
  {
    const d = new Date(); //creates a new date object "d"
    let hour = d.getHours();
    let month;
    month = d.getMonth() + 1;
    let day;
    day = d.getDate();
    if(hour >= 0 && hour <= 5) //checks if we need to change the returned date to account for the time zone
    {
      day = day-1;
    }
    botResponse = month.toString() + "/" + day.toString(); //returns in month/day format
    console.log(botResponse);
    body = {
      "bot_id" : botID,
      "text" : botResponse
    };
  }
  else if(commandNumber == 4)
  {
    const d = new Date();
    let month = d.getMonth() + 1;
    let day = d.getDate();
    let hour = d.getHours();
    if(hour >= 0 && hour <= 7) //checks if we need to change the returned date to account for the time zone
    {
      day = day-1;
    }
    const file = reader.readFile('./sobermonitors.xlsx'); //reads the spreadsheet
    let data = [];
    const sheets = file.SheetNames;

    for(let i = 0; i < sheets.length; i++) //converts the spreadsheet to something it can pull data from
    {
      const temp = reader.utils.sheet_to_json(
          file.Sheets[file.SheetNames[i]])
      temp.forEach((res) => {
        data.push(res)
      })
    }

    console.log(data);
    
    let date_index = -1;
    for(let i = 0; i < data.length; i++)
    {
      if(data[i].Month == month && data[i].Day == day) //checks if the current date matches a date in the spreadsheet
      {
        date_index = i;
      }
    }
    if(date_index != -1)  //returns the sober monitors if true
    {
      botResponse = "Sober monitors today are " + data[date_index].Name_1.toString() +  ", " + data[date_index].Name_2.toString() +  ", and " + data[date_index].Name_3.toString();
    }
    else //and this message if false
    {
      botResponse = "There are no sober monitors today.";
    }
    body = {
      "bot_id" : botID,
      "text" : botResponse
    };
  }

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}


exports.respond = respond;