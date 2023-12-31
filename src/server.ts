import express from "express";
import { GoogleService } from "./services";
import {AsanaService} from "./services";

const app = express();
const port = 8080;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get('/google/auth', (req, res) => {
  res.send(GoogleService.getAccessTokenUrl());
});

app.get('/google/callback', async (req, res) => {
  const code = req.query.code;
  await GoogleService.authorize(code as string);
})

app.get('/asana/callback', async (req, res) => {
  const code = req.query.code;
  //console.log(req);
  console.log(code);
  await AsanaService.getToken(code as string);
  return res.send({success: true});

})



app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
