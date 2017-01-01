'use strict';
var express = require('express');
var path = require('path');

var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('messages.sqlite');

var app = express()

app.use('/', express.static(path.join(__dirname, 'export')))



// the handlers

function getMessages(thread){
  messages = []
  if (thread) {
    db.each("SELECT thread, author, text, timestamp FROM messages WHERE thread = $thread", {"$thread": thread}, function(err, row) {
        console.log(row);
        messages.push(row)
    });
  } else {
    db.each("SELECT thread, author, text, timestamp FROM messages", function(err, row) {
        // console.log(row);
        messages.push(row);
    }, function(){
      console.log(messages);
    });
  }


}

function getThreads(participant){
  var threads = []
  if (participant) {

  } else{
    db.each("SELECT rowid AS id, participants, name FROM threads", function(err, row) {
        // console.log(row);
        threads.push(row);
    }, function(){
      console.log(threads)
      return threads;
    });
  }

}


function renameThread(id, new_name){
  db.get("SELECT * from threads where rowid = $id", {"$id": id}, function(err, row){
    // console.log(row)
    db.run("UPDATE messages SET thread = $new_name where thread = $old_name", {"$old_name": row.name, "$new_name": new_name});

    db.run("UPDATE threads SET name = $new_name where rowid = $id", {"$id": id, "$new_name": new_name});

  })

}

function renameParticipant(old_name, new_name){
    db.run("UPDATE messages SET author = $new_name where author = $old_name", {"$old_name": old_name, "$new_name": new_name});

}



// the routes


app.get('/data', function (req, res) {
  var _data = {}
  _data.threads = []
  _data.messages = []
  var thread = false;
  db.serialize(function(){
    if (thread) {
      db.each("SELECT thread, author, text, timestamp FROM messages WHERE thread = $thread", {"$thread": thread}, function(err, row) {
          console.log(row);
          _data.messages.push(row)
      });
    } else {
      db.each("SELECT thread, author, text, timestamp FROM messages", function(err, row) {
          // console.log(row);
          _data.messages.push(row);
      }, function(){
        console.log(_data);
      });
    }

    db.each("SELECT rowid AS id, participants, name FROM threads", function(err, row){
        _data.threads.push(row);
    }, function(){
      console.log(_data);

      res.send(_data);
    })
  })

})

app.get('/renamethread', function (req, res) {
  renameThread(req.query.id, req.query.new_name)
  console.log("renamed " + req.query.id + "to " + req.query.new_name)
  res.send("renamed " + req.query.id + "to " + req.query.new_name)
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
