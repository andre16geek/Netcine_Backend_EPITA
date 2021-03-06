import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Pusher from "pusher";
import dbModel from "./dbModel.js";

//backend for netcine
//app config
const app = express();
const port = process.env.PORT || 8080;

const pusher = new Pusher({
  appId: "1080167",
  key: "2b69997430639cdbd8c3",
  secret: "2dc53e01516cfb28de7d",
  cluster: "eu",
  useTLS: true,
  // encrypted: true
});

//app middlewares
app.use(express.json());
app.use(cors());

//DB config
const connection_url =
  "mongodb+srv://admin:HnCK5VDesVC07hBG@cluster0.3ywzz.mongodb.net/netcineDB?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", () => {
  console.log("DB connected");
  const changeStream = mongoose.connection.collection("posts").watch();
  changeStream.on("change", (change) => {
    console.log("change Triggered on pusher...");
    console.log(change);
    console.log("End of change");

    if (change.operationType === "insert") {
      console.log("Triggering Pusher ***IMG-UPLOAD***");
      const postDetails = change.fullDocument;
      pusher.trigger("posts", "inserted", {
        user: postDetails.user,
        caption: postDetails.caption,
        image: postDetails.image,
      });
    } else {
      console.log("unknown trigger from pusher");
    }
  });
});
//API routes
app.get("/", (req, res) =>
  res
    .status(200)
    .send(
      "Netcine backend is online. Goto https://netcine-epita.web.app/ to view the deployed application."
    )
);

app.post("/upload", (req, res) => {
  const body = req.body;

  dbModel.create(body, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/sync", (req, res) => {
  dbModel.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      data.sort((b, a) => {
        return a.timestamp - b.timestamp;
      });
      res.status(200).send(data);
    }
  });
});
//listen
app.listen(port, () => console.log(`listening on localhost:${port}`));
