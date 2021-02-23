const multer = require('multer');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
const mongoose = require('mongoose');

mongoURI = 'mongodb+srv://AndreeaSB:password8@cluster0-qziap.mongodb.net/Licenta?retryWrites=true&w=majority'

mongoose.Promise = global.Promise;
const conn = mongoose.createConnection(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
    console.log("Connected to MongoDB successfully :)");
}).catch((e) => {
    console.log("Error while attemting to connect to MongoDB");
    console.log(e);
});
const db = mongoose.connection;

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
let gfs;

db.once('open', () => {
    //init stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
})

//create storage engine
const crypto = require('crypto');
const path = require('path');
const GridFsStorage = require('multer-gridfs-storage');

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

app.post('/upload',upload.single('file') , (req,res) => {
    res.json({ file: req.file});
})

app.get('/image/:filename', (req,res) => {
    mongoose.gfs.files.findOne({filename: req.params.filename}, (err,file) => {
        if(!file || file.length === 0){
            return res.status(404).json({
                err: 'File not found!'
            });
        }

        if(file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType === 'image/gif') {
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not an image'
            });
        }
    });
}); 

