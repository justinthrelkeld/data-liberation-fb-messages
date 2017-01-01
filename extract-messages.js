'use strict';

var fs = require('fs');
var cheerio = require('cheerio');
var moment = require('moment');

var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('messages.sqlite');

db.serialize(function() {
  db.run("CREATE TABLE messages (thread TEXT, timestamp INTEGER, author TEXT, text TEXT)");
  db.run("CREATE TABLE threads (name TEXT, participants TEXT)");
});

fs.readFile('message_source.html', 'utf8', function(err, data) {
  if(err) {
      console.error("Could not open file: %s", err);
      return;
  }

  var $ = cheerio.load(data)

  var threads = []
  var messages = []
  var message_data = {threads: [], messages: []}

  $('div.thread').each(function(i, elem) {
    var thread = {}
    thread.participants = []
    thread.messages = []


    $(this).find('.user').each(function(i, elem) {
      var this_participant = $(this).text()
      var this_participant_known = thread.participants.indexOf(this_participant)

      // console.log(this_participant_known)

      if (this_participant_known === -1) {

        // console.log("found new participant " + this_participant)
        thread.participants.push(this_participant);
      }
      else {
        // console.log("found " + thread.participants[this_participant_known] + " again")
      }
    })
    message_data.threads.push(thread.participants.toString())

    // console.log(thread.participants);
    $(this).find('.message').each(function(i, elem) {
      var this_message = {}
      this_message.thread = thread.participants.toString()
      this_message.timestamp = $(this).find('.meta').text()
      this_message.timestamp = moment(this_message.timestamp, "dddd, MMMM D, YYYY at hh:mma ZZ").format('X')
      this_message.author = $(this).find('.user').text()
      this_message.text = $(this).next('p').text()

      thread.messages.push(this_message)
      messages.push(this_message)
    })

    threads.push(thread);

    console.log(messages)

  });

  db.serialize(function() {
    var stmt = db.prepare("INSERT INTO threads VALUES (?, ?)");
    for (var i = 0; i < message_data.threads.length; i++) {
      stmt.run(message_data.threads[i], message_data.threads[i]);
    }
    stmt.finalize();
  });

  message_data.messages = messages;


    db.serialize(function() {
      for (var i = 0; i < message_data.messages.length; i++) {
        var this_message = message_data.messages[i];
        message_data.messages[i] + i;
        console.log(this_message)
        db.run("INSERT INTO messages VALUES ($thread, $timestamp, $author, $text)", {
          $thread: this_message.thread,
          $timestamp: this_message.timestamp,
          $author: this_message.author,
          $text: this_message.text
        });
      }
    });

  fs.mkdir('export', function(err) {
    fs.writeFile('export/fb-threads.js', JSON.stringify(threads, null, ' '), function(err) {
      if(err) {
        console.error("Could not write file: %s", err);
      }
    });
    fs.writeFile('export/fb-messages.js', JSON.stringify(messages, null, ' '), function(err) {
      if(err) {
        console.error("Could not write file: %s", err);
      }
    });
    fs.writeFile('export/fb-message-data.js', JSON.stringify(message_data, null, ' '), function(err) {
      if(err) {
        console.error("Could not write file: %s", err);
      }
    });
  })

})
