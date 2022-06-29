const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const File = require("./models/File");
const app = express();
require("dotenv").config();

const upload = multer({ dest: "upload" });

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.get("/", (req, res) => {
    res.render("index");
});
app.post("/upload", upload.single("file"), async (req, res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname,
    }
    if (req.body.password != null && req.body.password !== "") {
        fileData.password = await bcrypt.hash(req.body.password, 10)
    }

    const file = await File.create(fileData)

    res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` })
});

app.route("/file/:id").get(handleFileDownload).post(handleFileDownload);


async function handleFileDownload(req, res) {
    const file = await File.findById(req.params.id)

    if (file.password != null) {
        if (req.body.password == null) {
            res.render("password")
            return
        }

        if (!(await bcrypt.compare(req.body.password, file.password))) {
            res.render("password", { error: true })
            return
        }
    }

    file.downloadCount++
    await file.save();
    res.download(file.path, file.originalName)
}

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Connected to DB and listening on port ${PORT}`);
        })
    })
    .catch(error => {
        console.log(error);
    });