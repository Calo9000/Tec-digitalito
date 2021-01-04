require('dotenv').config();
const app = require('./app');


require('./public/js/database');
const { dbMySql, neo4jSession } = require("./public/js/bases")

const serverChat = app.listen(app.get('port'));

//CHATTING PART
const io = require('socket.io').listen(serverChat);

io.on("connection", function (client) {
  console.log("Client connected...");

  // Upload File to uploads director
  client.on('send-file', function (name, buffer, userid) {
    var fs = require('fs');
    var timestamp = new Date().getTime();
    var imgName = timestamp + "-" + name
    //var fileName = '/home/jose/Downloads/OLA.jpeg';
    var fileName = 'C:\Users\carlo\Downloads\costarica.png';
    fs.open(fileName, 'a', 0755, function (err, fd) {
      if (err) throw err;
      fs.write(fd, buffer, null, 'Binary', function (err, written, buff) {
        fs.close(fd, function () {
          console.log('File saved successful!');
          client.emit("send_file", imgName, buffer, userid);
          client.broadcast.emit("send_file", imgName, buffer, userid);
        });
      })
    });
  });

  // preview File using base64
  client.on('preview-file', function (base64, userid) {
    client.emit("preview_file", base64, userid);
    client.broadcast.emit("preview_file", base64, userid);
  });


  // On Message broadCast it & Saved in DB
  client.on("messages", function (data) {
    client.emit("thread", data);
    client.broadcast.emit("thread", data);
    dbMySql.query("INSERT INTO messages (user_from,user_to,message,image,base64) VALUES ('" + data.user_id + "','" + data.user_to + "','" + data.message + "','" + data.image + "','" + data.base64 + "')");
  });

  client.on("getMessages", ({ myID, hisID }) => {
    dbMySql.query(`SELECT user_from,user_to,message,image,base64 
                 FROM messages where (user_from ="${myID}" AND user_to = "${hisID}") OR 
                 (user_from ="${hisID}" AND user_to = "${myID}") 
                 `,
      (err, result, fields) => {
        if (err) throw err;
        friendArray = []
        neo4jSession
        .run('MATCH (p:Person)-[STUDENT]->(c:Course) WHERE p.name = "'+hisID+'" RETURN c.name')
        .then((resultNeo4j) => {
          resultNeo4j.records.forEach((record) => {
            console.log("Soy un curso"+record._fields[0])
            friendArray.push(record._fields[0]);
          })
          client.emit("getM", result, friendArray)
        })
        .catch((err) => {
          console.log(err);
        })
      });
  })

  // On Typing... 
  client.on('is_typing', function (data) {
    if (data.status === true) {
      client.emit("typing", data);
      client.broadcast.emit('typing', data);
    } else {
      client.emit("typing", data);
      client.broadcast.emit('typing', data);
    }
  });

});

