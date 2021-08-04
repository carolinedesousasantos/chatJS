module.exports = {
    loadMessages: async function (connection, historicMessages,callback = () => { }) {
        return new Promise((resolve, reject) => {
            connection.query(
                `SELECT * FROM chatMessages ORDER BY date ASC;`,
                (err, rows) => {
                    if (err) {
                        return reject(err)
                    }
                    for (const row of rows) {
                        historicMessages.push({
                            msg: row.messages,
                            username: row.username,
                            date: row.date,
                            to: row.to
                        });
                    }
                    console.log("rows:", rows);
                    return resolve(rows)
                }
            )
        })
    },
    loadUsers: async function (connection,usuarios, callback = () => { }) {
        return new Promise((resolve, reject) => {
            connection.query(
                `SELECT * FROM chatUsers;`,
                (err, rows) => {
                    if (err) {
                        return reject(err)
                    }
                    for (const row of rows) {
                        usuarios.push({
                            username: row.username,
                            date: row.date,
                            status: row.status
                        })
                    }
                    
                    return resolve(rows)
                }
            )
        })
    },
    getMessageByUserName: function (connection,username, callback) {
        return new Promise((resolve, reject) => {
            connection.query(
                `SELECT * FROM chatMessages WHERE username = '${username}' OR to = '${username}'
             ORDER BY creation ASC;`,

                (err, rows) => {
                    console.log(rows, "rows");
                    if (err) {
                        return reject(err)
                    }
                    callback(rows);
                    return resolve(rows)
                }
            )
        })
    },
    insertMessages: async function (connection, msg, date, historicMessages) {
        const messages = { messages: msg.msg, date: date, username: msg.username, to: msg.to };
        connection.query('INSERT INTO chatMessages SET ?', messages, (err, res) => {
            if (err) throw err;

            console.log(err, "err insert");
            console.log('Last insert ID:', res.insertId);
        });
        await connection.commit();
        historicMessages.push({
            msg: msg.msg,
            username: msg.username,
            date: date,
            to: msg.to
        });

    },
    insertUsers: async function (connection,info) {
        const userInfo = { username: info.username, date: info.date, status: info.status };
        connection.query('INSERT INTO chatUsers SET ?', userInfo, (err, res) => {
            if (err) throw err;

            console.log(err, "err insert");
            console.log('Last insert ID:', res.insertId);
        });
        await connection.commit();
    },
    updateUsers: async function (connection,info) {
        const userInfo = { date: info.date, status: info.status };
        connection.query(`UPDATE chatUsers SET ? WHERE username='${info.username}'`, userInfo, (err, res) => {
            if (err) throw err;
            console.log(err, "err update");
        });
        await connection.commit();
    }
}