var app = require('http').createServer(resposta); // Criando o servidor
var fs = require('fs'); // Sistema de arquivos
const io = require("socket.io")(app, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

var usuarios = [];
var storageUserMessagesArray = [];

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
    socket.on("entrar", function (obj, callback) {
        if (!(obj.username in usuarios)) {
            socket.username = obj.username;
            usuarios[obj.username] = socket;

            var mensagem = "<b>" + obj.username + "</b> acabou de entrar na sala";
            var date = getDateTime();
            var obj_mensagem = {
                msg: mensagem,
                tipo: 'online',
                user: obj.username,
                date: date,
                usuarios: usuarios,
                sendTo: obj.sendTo
            };

            for (usuario in usuarios) {
                if (usuario != obj.username) {
                    io.sockets.emit("atualizar mensagens", obj_mensagem);
                }
            }

            io.sockets.emit("atualizar usuarios", Object.keys(usuarios));
            storageUserMessages(usuario, mensagem, date, obj.sendTo, 'online');
            callback(true);
        } else {
            callback(false);
        }
    });

    socket.on("enviar mensagem", function (dados, callback) {
        var mensagem_enviada = dados.msg;
        var usuario = dados.username;
        var sendTo = dados.sendTo;
        mensagem_enviada = usuario + " diz: " + mensagem_enviada;
        var date = getDateTime();
        var obj_mensagem = {
            msg: mensagem_enviada, tipo: 'login',
            user: usuario, date: date, usuarios: usuarios, sendTo: sendTo
        };

        if (dados.sendTo == 'grupo') {
            for (user in usuarios) {
                usuarios[user].emit("atualizar mensagens", obj_mensagem);
            }
        } else {
            usuarios[usuario].emit("atualizar mensagens", obj_mensagem);
            usuarios[sendTo].emit("atualizar mensagens", obj_mensagem);
        }
        storageUserMessages(usuario, mensagem_enviada, date, sendTo, '');

        callback();
    });

    socket.on("get messages", function (dados, callback) {
        var allMessages = [];
        for (var i = 0; i < storageUserMessagesArray.length; i++) {
            if (storageUserMessagesArray[i].sendTo == dados.selectedUser) {
                allMessages.push(storageUserMessagesArray[i]);
            }
        }
        callback(allMessages);
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

function getDateTime() {
    var dataAtual = new Date();
    var dia = (dataAtual.getDate() < 10 ? '0' : '') + dataAtual.getDate();
    var mes = ((dataAtual.getMonth() + 1) < 10 ? '0' : '') + (dataAtual.getMonth() + 1);
    var ano = dataAtual.getFullYear();
    var hora = (dataAtual.getHours() < 10 ? '0' : '') + dataAtual.getHours();
    var minuto = (dataAtual.getMinutes() < 10 ? '0' : '') + dataAtual.getMinutes();
    var segundo = (dataAtual.getSeconds() < 10 ? '0' : '') + dataAtual.getSeconds();

    var dataFormatada = dia + "/" + mes + "/" + ano + " " + hora + ":" + minuto + ":" + segundo;
    return dataFormatada;
}

function storageUserMessages(usuario, mensagem_enviada, date, sendTo, tipo) {
    storageUserMessagesArray.push({
        user: usuario,
        msg: mensagem_enviada,
        date: date,
        sendTo: sendTo,
        tipo: tipo
    });
}