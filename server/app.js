require('./config/passportConfig');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const passport = require('passport');
const jwtHelper = require('./config/jwtHelper');
const _ = require('lodash');
const cors = require('cors');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const { User, TempUser, Image, Album, AlbumName } = require('./db/models/index');
const methodOverride = require('method-override');
const Grid = require('gridfs-stream');

//Midlleware
app.use(bodyParser.json());
app.use(cors());
app.use(passport.initialize());
app.use(methodOverride('_method'));

const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const GridFsStorage = require('multer-gridfs-storage');
const mongoose = require('mongoose');

mongoURI = 'mongodb+srv://AndreeaSB:password8@cluster0-qziap.mongodb.net/Licenta?retryWrites=true&w=majority'

mongoose.Promise = global.Promise;
mongoose.connect(mongoURI, { useUnifiedTopology: true, useNewUrlParser: true}).then(() => {
    console.log("Connected to MongoDB successfully :)");
}).catch((e) => {
    console.log("Error while attemting to connect to MongoDB");
    console.log(e);
});
const conn = mongoose.connection;

let gfs;
conn.on('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);


// for sending emails
let transporter = nodemailer.createTransport({
    host: 'smtp.googlemail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'BadeaSAndreea',
        pass: 'pASSWORD8'
    }
});

app.post('/register', (req,res,next) => {
    let newUser = new TempUser({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password
    });
    newUser.verificationToken = randomstring.generate(8);
    newUser.save((err, newUserDoc) => {
        if (!err){
    
            res.send(newUserDoc);
    
            let mailOptions = {
                from: ' "AppName Team" ',
                to: newUser.email,
                subject: 'Verification email',
                text: newUser.verificationToken + ' is your activation code.'
            };
    
            transporter.sendMail(mailOptions, (error,info) => {
                if(error) {
                    return console.log(error);
                }
                console.log('Email sent: %s', info.messageId);
            });
        } else {
    
            if(err.code == 11000) {
        
                res.status(422).send(['Dublicate email adrress found.']);
            } else {
        
                return next(err);
            }
        }
    })
})//merge       

app.post('/verify',(req,res,next) => {
    TempUser.findOne({ verificationToken: req.body.verificationToken},(err,tempUser) => {
        if(!tempUser){
            return res.status(404).json({ status: false, message: 'Code not found!'});
        } else {
            let newUser = new User({
                name: tempUser.name,
                lastName: tempUser.lastName,
                email: tempUser.email,
                password: tempUser.password,
                saltSecret: tempUser.saltSecret
            });
            newUser.save();
            tempUser.remove();
            return res.status(200).json({ status:true, message: 'Welcome!'})
        }
    }).catch(() => {})
})//merge     

app.post('/authenticate', (req,res,next) => {
    passport.authenticate('local', (err,user,info) => {
        if(err){
            return res.status(400).json(err);
        } else if(user){
            return res.status(200).json({ "token": user.generateJwt()});
        }else  {
            return res.status(404).json(info);
        }
    })(req, res, next);
})//merge     

app.post('/upload', jwtHelper.verifyJwtToken, upload.single('file') , (req,res) => {
    newFile = req.file;
    res.json({newFile});
    let newImage = new Image({
        filename: newFile.filename,
        user_id:req.user_id
    });
    newImage.save(); 
    res.send(req.file);
})//merge     

app.get('/image/:filename', (req, res) => { //returneza o imagine din baza de date
    gfs.files.findOne({ filename: req.params.filename}, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }

        if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } else {
            res.status(404).json({err: 'not an image'});
        }
    });
});//merge     

app.get('/files',jwtHelper.verifyJwtToken, (req,res) => { //returneza un array cu imaginile existente
    gfs.files.find({user_id:req.user_id}).toArray((err, files) => {
        if(!files || files.length === 0) {
            return res.status(404).json({
                err: 'No files'
            });
        }
        return res.send(files);
    });
});//merge

app.delete('/image/:filename', (req,res)=> {//sterge o imagine din baza de date
    gfs.files.findOne({filename: req.params.filename}, (err,file1) => {
        if(file1 != null) {
            gfs.remove({ _id: file1._id, root:'uploads' },function(err, file2) {
                if(err) {
                    res.send(err);
                } else {
                }

            })
        } else {
            if(!file1) {
                res.send(['not found'])
            }
            else{
                res.send(err);
            }
        }
    })
   
})//merge

app.get('/images', jwtHelper.verifyJwtToken, (req,res) => {//returneaza 10 imagini(paginare)
    var pageNo = req.query.pageNo;
    var size = 10;
    var toSkip = (pageNo - 1) * size;
    
    Image.find({user_id:req.user_id}, null, {skip: toSkip, limit: size}, function(err, images) {
       if(!err) {
        res.send(images)
       } else {
           res.send(err)
       }
   })
})//merge     

app.delete('/images/:filename', jwtHelper.verifyJwtToken, (req,res) => {//sterge o imagine din tabelele images si albums
    Image.findOneAndDelete({ filename: req.params.filename, user_id: req.user_id}, function(err,file3) {
        if (err) {
            res.send(err)
        } else {
            res.send(file3)
        }
    })
    Album.deleteMany({ filename: req.params.filename, user_id: req.user_id}, function(err) {
        if(err){
            res.send(err)
        }
    })
})//o sa fie folosita pt. stergerea unei imaginii din baza de date *** nu merge daca le combin, o voi apela separat

app.post('/newalbum', jwtHelper.verifyJwtToken, (req,res) => {//creeaza un nou album
    console.log('test new album')
    let newAlbum = new AlbumName({
        name: req.body.name,
        description: req.body.description,
        user_id:req.user_id
    });
    newAlbum.save((err, newalbumDoc) => {
        if(!err) {
            res.send(newalbumDoc);
        } else {
            res.send(err);
        }
    });
})//merge

 app.post('/album', jwtHelper.verifyJwtToken, (req,res) => {//adauga o image intr-un album(albumName reprezinta albumele, album reprezinta legaturile facute intre imagini si albume)
     let filename = req.body.filename;
     let albumName = req.body.albumName;
     let _id = req.user_id
     
     let newAlbum = new Album({
        filename: filename,
        albumname: albumName,
        user_id:_id
   })
    newAlbum.save((err, newalbumDoc) => {
      if(!err) {
        res.send(newalbumDoc);
       } else {
          if(err.code == 11000) {
            return res.status(422).json({error: 'Dublicate file found.'});
       }
     }
   });
})//merge

 app.get('/albums', jwtHelper.verifyJwtToken, (req,res) => {//returneaza albumele
     AlbumName.find({user_id:req.user_id}).then((albums) => {
         res.send(albums);
         consile.log(albums);
     }).catch(() => {});
 })//merge

 app.get('/album/:name', jwtHelper.verifyJwtToken, (req,res) => {//returneaza imaginile dintr-un album,paginate
    var pageNo = parseInt(req.query.pageNo);
    var size = 3;
    var toSkip = (pageNo - 1) * size;
    Album.find({user_id:req.user_id, albumname: req.params.name}, null, {skip: toSkip, limit: size}).then((images) => {
        res.send(images)
    }) 
 })//merge

 app.delete('/album/:name', jwtHelper.verifyJwtToken, (req,res) => {//sterge un album si legaturile facute intre album si imagini
    let name = req.params.name;
    let user_id = req.user_id;
     Album.deleteMany({ user_id: user_id, albumname: name}, function(err, result) {
         if(err){
             res.send(err)
         } else {
             res.send(result)
         }
     })
    AlbumName.findOneAndRemove({ user_id: user_id, name: name }).then((removedAlbumDoc) => {
        res.send(removedAlbumDoc);
    }).catch(()=>{})
 })//merge

 app.delete('/album/:albumName/:filename', jwtHelper.verifyJwtToken, (req,res) => {//sterge legatura facuta intre un album si o imagine
     Album.findOneAndRemove({user_id: req.user_id, albumname: req.params.albumName, filename: req.params.filename}).then((removedFileDoc) => {
         res.send(removedFileDoc);
     }).catch(() => {});
 })//merge
app.listen(3000, () => {
    console.log("Server is listening on port 3000!");
})