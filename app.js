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


var mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Vbest@787898',
    database: 'textme',
    multipleStatements: true,
    connectionLimit: 10,

})

mysqlConnection.connect((err) => {
    if (!err) {
        console.log("connection established successfully")
    } else {
        console.log("connection failed")
        console.log(JSON.stringify(err))
    }
})

const port = 8000;

app.listen(port, () => console.log(`listening on port ${port}`))


// apis

// register user

app.post('/registerUser', (req, res) => {
    const { name, mNumber, password } = req.body

    const enteredPassword = password;

    bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(enteredPassword, salt, function (err, hash) {
            console.log(hash)
            const sql = `INSERT INTO register(username, mNumber, user_password) VALUES ('${name}', '${mNumber}', '${hash}')`;
            mysqlConnection.query(sql, function (err, result) {
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
    mysqlConnection.query(sql, async function (err, result) {
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
    const personBName = req.body.personBName
    const searchQuerySql = `SELECT * from register where mNumber='${personBNumber}'`;
    const addContactQuerySql = `INSERT INTO contact (personA, personB, name) VALUES ('${personANumber}', '${personBNumber}', '${personBName}')`
    mysqlConnection.query(searchQuerySql, function (err, result) {
        console.log("main result", typeof result)
        if (err) {
            throw err;
        }
        else if (result.length === 0) {
            res.send("The entered number is unavailable in textme")
        } else if (result.length > 0) {
            setTimeout(() => {
                mysqlConnection.query(addContactQuerySql, function (err, result) {
                    if (err) throw err
                    res.send(result)
                })
            }, 500)
        }
    })
})



// get request to get all contacts

app.post('/getAllContacts', (req, res) => {
    const personANumber = req.body.personANumber
    const sql = `SELECT * FROM contact where personA = '${personANumber}'`;

    mysqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
    })
})

// get request to get all chatting friends list
app.post('/getAllChatters', (req, res) => {
    const personANumber = req.body.personANumber
    
    const sql = `SELECT * FROM contact where personA = '${personANumber}' && chatInit= '1'`;

    mysqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
    })
})
//set mobile number
let mobile_number;
app.post('/setNumber', (req, res) => {
    if(req.body.mobile_number)
        mobile_number = req.body.mobile_number
    res.send('OK')
    
})
//set profile picture
app.post('/setProfileImage',upload.single('image'), (req, res) => {
    // const image = req.body.image
    // const mobile_number = req.body.mobile_number
    // console.log("requestbody" , req.body)
    console.log(req.file)
    const image = req.file.filename
    
    const sql = `UPDATE register SET image='${image}' where mNumber='${mobile_number}'`;

    mysqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result);
    })
})

// get profile Details

app.get('/getProfile', (req, res) => {
    const sql = `SELECT * FROM register where mNumber = '${mobile_number}'`;

    mysqlConnection.query(sql, function (err, result) {
        if (err) throw err;
        res.send(result[0]);
    })
})

