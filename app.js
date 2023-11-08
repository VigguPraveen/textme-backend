const mysql = require('mysql2')
const express = require("express")
const bodyparser = require("body-parser")
const cors = require('cors')
const bcrypt = require('bcrypt')
const path = require('path')
const multer = require('multer')
const saltRounds = 10;

var app = express()

app.use(bodyparser.json())
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage
})


// var mysqlConnection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'Vbest@787898',
//     database: 'textme',
//     multipleStatements: true,
//     connectionLimit: 10,

// })

// mysqlConnection.connect((err) => {
//     if (!err) {
//         console.log("connection established successfully")
//     } else {
//         console.log("connection failed")
//         console.log(JSON.stringify(err))
//     }
// })
const mySqlConnection = mysql.createConnection({
    host: 'sql12.freemysqlhosting.net',
    user: 'sql12659956',
    password: 'vKQS4UWqSL',
    database: 'sql12659956',
    multipleStatements: true,
    connectionLimit: 10,
})

mySqlConnection.connect((err) => {
    if (!err) {
        console.log("connection established successfully")
    } else {
        console.log("connection failed")
        console.log(JSON.stringify(err))
    }
})

const port = 9898;

app.listen(port, () => console.log(`listening on port ${port}`))

let mobile_number;
// apis

// register user

app.post('/registerUser', (req, res) => {
    const { name, mNumber, password } = req.body

    const enteredPassword = password;

    bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(enteredPassword, salt, function (err, hash) {
            console.log(hash)
            const sql = `INSERT INTO register(username, mNumber, user_password) VALUES ('${name}', '${mNumber}', '${hash}')`;
            mySqlConnection.query(sql, function (err, result) {
                if (err) throw err;
                console.log('1 row inserted', result);
                res.send(result);
            })
        })
    })
})

// login user

app.post('/login', async (req, res) => {
    const enteredNumber = req.body.mobile_number;
    const enteredPassword = req.body.password;
    let storedPassword;
    const sql = `SELECT * from register where mNumber='${enteredNumber}'`;
    mySqlConnection.query(sql, async function (err, result) {
        if (err) {
            res.send(err)
        }
        if (result[0].mNumber === enteredNumber) {
            storedPassword = result[0].user_password;

            const passwordMatch = await bcrypt.compare(enteredPassword, storedPassword)

            if (passwordMatch) {
                res.send(result[0].mNumber)
            } else {
                res.send("Access Denied")
            }
        }
    })
})
// add contact

app.post('/addContact', async (req, res) => {
    const personANumber = req.body.personANumber
    const personBNumber = req.body.personBNumber;
    const personBName = req.body.personBName;
    let profileimage;
    const searchQuerySql = `SELECT * from register where mNumber='${personBNumber}'`;
    mySqlConnection.query(searchQuerySql, function (err, result) {
        console.log("main result", typeof result)
        if (err) {
            throw err;
        }
        else if (result.length === 0) {
            res.send("The entered number is unavailable in textme")
        } else if (result.length > 0) {
            profileimage = result[0].image
            setTimeout(() => {
                const addContactQuerySql = `INSERT INTO contact (personA, personB, name, profileimage) VALUES ('${personANumber}', '${personBNumber}', '${personBName}','${profileimage}')`
                mySqlConnection.query(addContactQuerySql, function (err, result) {
                    if (err) throw err
                    res.send(result)
                })
            }, 500)
        }
    })
})



// get request to get all contacts

app.get('/getAllContacts', (req, res) => {
    console.log(mobile_number)
    const sql = `SELECT * FROM contact where personA = '${mobile_number}'`;
    mySqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
    })
})

// get request to get all chatting friends list
app.post('/getAllChatters', (req, res) => {
    const personANumber = req.body.personANumber

    const sql = `SELECT * FROM contact where personA = '${personANumber}' && chatInit= '1'`;

    mySqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
    })
})
//set mobile number

app.post('/setNumber', (req, res) => {
    if (req.body.mobile_number)
        mobile_number = req.body.mobile_number
    res.send('OK')

})
//set profile picture
app.post('/setProfileImage', upload.single('image'), (req, res) => {

    console.log(req.file)
    const image = req.file.filename

    const sql = `UPDATE register SET image='${image}' where mNumber='${mobile_number}'`;
    const updateContactTableQuery = `UPDATE contact SET profileimage='${image}' where personB='${mobile_number}'`
    const updateChatTableQuery = `UPDATE chat SET profileimage='${image}' where personB='${mobile_number}'`

    mySqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
    })

    mySqlConnection.query(updateContactTableQuery, function (err, result) {
        if (err) throw err;
        res.send(result);
    })
    mySqlConnection.query(updateChatTableQuery, function (err, result) {
        if (err) throw err;
        res.send(result);
    })

})

// get profile Details

app.get('/getProfile', (req, res) => {
    const sql = `SELECT * FROM register where mNumber = '${mobile_number}'`;

    mySqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result[0]);
    })
})

// post chats

app.post('/sendChat', (req, res) => {
    console.log(req.body)
    const { date, personA, personB, chats, personBName } = req.body

    let personBProfileImage;

    const getQuery = `SELECT * FROM contact where personB='${personB}'`
    mySqlConnection.query(getQuery, function (err, result) {
        if (err) throw err;
        res.send("ok");
        personBProfileImage = result[0].profileimage
    })
    setTimeout(() => {
        const sql = `INSERT INTO chat(chatdate, personA, personB, chats, name, profileimage) VALUES ('${date}', '${personA}', '${personB}','${chats}', '${personBName}', '${personBProfileImage}' )`;
        mySqlConnection.query(sql, function (err, result) {
            if (err) throw err;
            res.send(result[0]);
        })
    }, 500)

})

app.get('/getChat', (req, res) => {
    const sql = `SELECT * from chat where personA='${mobile_number}'`
    mySqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
    })
})

app.post('/getOnePersonChat', (req, res) => {

    const { personBNumber } = req.body
    const sql = `SELECT * from chat where personA='${mobile_number}' AND personB='${personBNumber}' OR personB='${mobile_number}' AND personA='${personBNumber}'`
    mySqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
    })
})

app.post('/updateTypingStatus', (req, res) => {
    const { personANumber, personBNumber, status } = req.body

    const sql = `UPDATE contact SET chatStatus = '${status}' where personA='${personANumber}' AND personB='${personBNumber}'`
    mySqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
    })
})

app.post('/getTypingStatus', (req, res) => {
    const { personBNumber } = req.body

    const sql = `SELECT * from contact where personA='${personBNumber}' AND personB='${mobile_number}'`
    mySqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
        console.log(result)
    })
})

