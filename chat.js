var app = require('http').createServer(resposta); // Criando o servidor
var fs = require('fs'); // Sistema de arquivos
const io = require("socket.io")(app, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const mysql = require('mysql');
const persistence = require('./persistence.js');
const utils = require('./util.js');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'chat'
});
//global 
var usuarios = [];
var historicMessages = [];
persistence.loadUsers(connection, usuarios);
persistence.loadMessages(connection, historicMessages);


app.listen(3000);

console.log("Aplicação está em execução...");

// Função principal de resposta as requisições do servidor
function resposta(req, res) {
    var arquivo = "";
    if (req.url == "/") {
        arquivo = __dirname + '/index.html';
    } else {
        arquivo = __dirname + req.url;
    }
    fs.readFile(arquivo,
        function (err, data) {
            if (err) {
                res.writeHead(404);
                return res.end('Página ou arquivo não encontrados');
            }

            res.writeHead(200);
            res.end(data);
        }
    );
}

io.on("connection", function (socket) {
    var date = utils.getDateTime();
    socket.on("entrar", function (obj, callback) {

        var updateUser = false;
        for (const u of usuarios) {
            if (u.username == obj.username) {
                updateUser = true;
            }
        }
        var info = {
            username: obj.username,
            date: date,
            status: 'online'
        }
        if (updateUser) {
            persistence.updateUsers(connection, info);
            for (const u of usuarios) {
                if (u.username == obj.username) {
                    u.date = info.date;
                    u.status = info.status;
                }
            }
        } else {
            persistence.insertUsers(connection, info);
            usuarios.push(info);
        }

        if (!(obj.username in usuarios)) {
            socket.username = obj.username;
            usuarios[obj.username] = socket;
        }

        var msg = "<b>" + obj.username + "</b> acabou de entrar na sala";
        var obj_msg = {
            msg: msg,
            tipo: 'online',
            user: obj.username,
            date: date,
            to: obj.to
        };
        io.sockets.emit("atualizar usuarios", usuarios);

        for (let usuario in usuarios) {
            if (usuario != obj.username) {
                //io.sockets.emit("atualizar mensagens", obj_msg);
            } else {
                console.log(obj, "chamou");

                var authorizedMessages = utils.loadMessagesAuthorized(historicMessages, obj.username);
                socket.emit("historic", authorizedMessages);
            }
        }

        callback(true);

    });

    socket.on("enviar mensagem", function (dados, callback) {
        var mensagem_enviada = dados.username + " diz: " + dados.msg;
        var obj_mensagem = {
            msg: mensagem_enviada,
            username: dados.username,
            date: date,
            to: dados.to
        };
        persistence.insertMessages(connection, obj_mensagem, date, historicMessages);
        //historicMessages.push(obj_mensagem);

        if (dados.to == 'grupo') {
            for (let user in usuarios) {
                //if user is online
                if (user[dados.username]) {
                    user[dados.username].emit("atualizar mensagens", obj_mensagem);
                }
            }
        } else {
            usuarios[dados.username].emit("atualizar mensagens", obj_mensagem);

            if (usuarios[dados.to]) {
                usuarios[dados.to].emit("atualizar mensagens", obj_mensagem);
            }
        }


        callback();
    });

    // socket.on("disconnect", function (dados) {
    //     console.log(dados,"dados disconet");
    //     mensagem = "<b>"+socket.username + "</b> saiu da sala";
    //     var date = getDateTime();
    //     var obj_mensagem = {
    //         msg: mensagem, tipo: 'offline', user: socket.username,
    //         date: date, usuarios: usuarios
    //     };

    //     delete usuarios[socket.nombre];
    //     io.sockets.emit("atualizar usuarios", Object.keys(usuarios));
    //     io.sockets.emit("atualizar mensagens", obj_mensagem);
    // });

});

