
module.exports = {
    getDateTime: function () {
        var now = new Date();
        var day = (now.getDate() < 10 ? '0' : '') + now.getDate();
        var month = ((now.getMonth() + 1) < 10 ? '0' : '') + (now.getMonth() + 1);
        var year = now.getFullYear();
        var hours = (now.getHours() < 10 ? '0' : '') + now.getHours();
        var minutes = (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
        var seconds = (now.getSeconds() < 10 ? '0' : '') + now.getSeconds();
        return day + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
    },
    loadMessagesAuthorized: function (historicList, username) {
        var messagesAuthorized = [];
        for (const historic of historicList) {
           
            if (historic.username == username ||
                historic.to == username ||
                historic.to == 'grupo'
            ) {
                messagesAuthorized.push(historic);
            }
        }
        return messagesAuthorized;
    }
}