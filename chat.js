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
    database: 'chat',
    charset: 'utf8mb4'
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
        for (const user of usuarios) {
            if (user.username == obj.username) {
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
            for (const user of usuarios) {
                if (user.username == obj.username) {
                    user.date = info.date;
                    user.status = info.status;
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

        io.sockets.emit("actualizar usuarios", usuarios);

        for (let usuario in usuarios) {
            if (usuario == obj.username) {
                var authorizedMessages = utils.loadMessagesAuthorized(historicMessages, obj.username);
                socket.emit("historic", authorizedMessages);
        }
    }
        callback(true);

    });

    socket.on("enviar mensage", function (dados, callback) {
        var mensagem_enviada = dados.username + ": " + dados.msg;
        var obj_mensagem = {
            msg: mensagem_enviada,
            username: dados.username,
            date: date,
            to: dados.to
        };
        persistence.insertMessages(connection, obj_mensagem, date, historicMessages);
        historicMessages.push(obj_mensagem);

        if (dados.to == 'grupo') {
            io.sockets.emit("actualizar mensages", obj_mensagem);
        } else {
            usuarios[dados.username].emit("actualizar mensages", obj_mensagem);
            if (usuarios[dados.to]) {
                usuarios[dados.to].emit("actualizar mensages", obj_mensagem);
            }
        }

        callback();
    });

    socket.on("disconnect", function () {
            var info = {
                username: socket.username,
                date: date,
                status: 'offline'
            };
            try{
                persistence.updateUsers(connection, info);
                try {
                    for (const user of usuarios) {
                        if (user.username == socket.username) {
                            user.date = info.date;
                            user.status = info.status;
                        }
                    }
                    console.log(usuarios, "depois de desconectar");
                    io.sockets.emit("actualizar usuarios", usuarios);
                } catch (error){
                    console.log(error);
                }
            }catch(error){
                console.log(error);
            }
    });
});

