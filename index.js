const express = require('express')
const DataStore = require('nedb')
const cookieParser = require("cookie-parser");
const multer = require('multer');
const path = require('path');

const app = express()

app.use(express.static('public'))
app.use(express.json())
app.use(cookieParser())

const port = process.env.PORT || 3000;

app.listen(3000, ()=> {
  console.log('Server running on port 3000')
})

const db = {
    users: new DataStore('users.db')
}

db.users.loadDatabase()


app.post('/login', (req, res)=> {
    const user = req.body
    
    db.users.find({email: user.email, pass: user.pass}, (err, data)=> {
        let success = false
        let d;
        
        for (let i = 0; i < data.length; i++) {
            if(data[i].email === user.email && data[i].pass === user.pass) {
                success = true
                d = data[i]
                break
            }
        }

        let cookie = req.cookies.user;

        if(cookie == undefined || cookie == '') {
            if(success) {
                res.cookie('user', d._id, {maxAge: 900000, httpOnly: true});
            }
        } 

        res.json({success})
    })

})

app.post('/register', (req, res)=> {
    const user = req.body
    
    db.users.insert({
        email: user.email,
        pass: user.pass,
        name: '',
        description: '',
        photo: '',
        social: {
            facebook: '',
            whatsapp: '',
            twitter: '',
            discord: '',
            youtube: '',
            linkedin: ''
        }
    })

    res.json({success: true})
})


app.post('/publicinfo', (req, res)=> {
    const info = req.body
    const id = req.cookies.user;

    const {name, surname, description, city, professions, date, bairro, social} = info;

    db.users.update({ _id: id }, 
        { $set: {
            name, surname, description, city, professions, date, bairro,
            "social.facebook": social.facebook,
            "social.twitter": social.twitter,
            "social.youtube": social.youtube,
            "social.discord": social.discord,
            "social.linkedin": social.linkedin,
            "social.whatsapp": social.whatsapp,
        } },
        {}, (err, numReplaced) => {
          if (err) {
            console.error(err);
            return;
          }
        }
      );

    res.json({success: true})
})

app.get('/logout', (req, res)=> {
    res.cookie("user", "", { maxAge: 0 });
    res.sendFile( __dirname + "/" + "public/login.html" );
})

app.get('/users', (req, res)=> {
    db.users.find({}, (err, data)=> {
        let users = [];
        
        data.forEach(d => {
            users.push({
                name: d.name,
                surname: d.surname,
                description: d.description,
                city: d.city,
                professions: d.professions,
                date: d.date,
                photo: d.photo,
                bairro: d.bairro,
                social: d.social
            });   
        });

        res.json(users);
    })
})

app.get('/myinfo', (req, res)=> {
    const id = req.cookies.user;

    db.users.find({_id: id}, (err, data)=> {
        res.json(data[0]);
    });
});

app.post('/updatepassword', (req, res)=> {
    const info = req.body;
    const id = req.cookies.user;

    db.users.find({_id: id, pass: info.pass}, (err, data)=> {
        if(data.length > 0) {
            db.users.update({ _id: id }, 
                { $set: {
                    pass: info.newPass
                } },
                {}, (err, numReplaced) => {
                  if (err) {
                    console.error(err);
                    return;
                  }
                }
            );

            res.json({success: true});
        } else {
            res.json({success: false});
        }
    });
});

app.post('/updatemail', (req, res)=> {
    const info = req.body;
    const id = req.cookies.user;

    db.users.update({ _id: id }, 
        { $set: {
            email: info.email
        } },
        {}, (err, numReplaced) => {
          if (err) {
            console.error(err);
            return;
          }
        }
    );
});


// Routes
app.get('/login', (req, res)=> {
    if(req.cookies.user !== '' && req.cookies.user !== null && req.cookies.user !== undefined) {
        res.sendFile( __dirname + "/" + "public/dashboard.html" );
    } else {
        res.sendFile( __dirname + "/" + "public/login.html" );
    }
});

app.get('/signup', (req, res)=> {
    if(req.cookies.user !== '' && req.cookies.user !== null && req.cookies.user !== undefined) {
        res.sendFile( __dirname + "/" + "public/dashboard.html" );
    } else {
        res.sendFile( __dirname + "/" + "public/signup.html" );
    }
});

app.get('/dashboard', (req, res)=> {
    if(req.cookies.user !== '' && req.cookies.user !== null && req.cookies.user !== undefined) {
        res.sendFile( __dirname + "/" + "public/dashboard.html" );
    } else {
        res.sendFile( __dirname + "/" + "public/login.html" );
    }
});

app.post('/upload', (req, res)=> {
    const id = req.cookies.user;

    const storage = multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'public/images/');
        },

        // By default, multer removes file extensions so let's add them back
        filename: function(req, file, cb) {
            
            db.users.update({ _id: id }, 
                { $set: {
                    photo: id + path.extname(file.originalname)
                } },
                {}, (err, numReplaced) => {
                  if (err) {
                    console.error(err);
                    return;
                  }
                }
            );

            cb(null, id + path.extname(file.originalname));
        }
    });

    // 'upload' is the name of our file input field in the HTML form
    let upload = multer({ storage: storage}).single('upload');

    upload(req, res, function(err) {
        // req.file contains information of uploaded file
        // req.body contains information of text fields, if there were any

       

        // if (req.fileValidationError) {
        //     return res.send(req.fileValidationError);
        // }
    
        // else if (err instanceof multer.MulterError) {
        //     return res.send(err);
        // }
        // else if (err) {
        //     return res.send(err);
        // }

        // Display uploaded image for user validation
        res.sendFile( __dirname + "/" + "public/dashboard.html" );
    });

});