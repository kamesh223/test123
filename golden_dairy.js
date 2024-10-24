const express = require("express");
const bodyParser = require("body-parser");
const CookieParser = require("cookie-parser");
const morgan = require("morgan");
const chalk = require("chalk");
const cors = require("cors");
const moment = require("moment");
const config = require("./config/config");
const routes = require("./routes/router");
const ApiMessages = require("./config/ApiMessages");
const connectToDb = require("./config/connect");
const ResponseController = require("./controllers/ResponseController");
const app = express();
const expressSwagger = require("express-swagger-generator")(app);
const axios = require("axios");


let options = {
  swaggerDefinition: {
    info: {
      description: "This is a NodeJs Development Server for Golden-Diary",
      title: "Golden-Diary",
      version: "1.0.0",
    },
    host: `${config.host}:${config.port}`,
    basePath: "/",
    produces: ["application/json"],
    schemes: ["http"],
    securityDefinitions: {
      JWT: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "",
      },
    },
  },
  basedir: __dirname,
  files: ["./routes/**/*.js"], //Path to the API handle folder
};

expressSwagger(options);

app.use(cors({ origin: "*" }));
app.use(bodyParser.text({ limit: config.BodyParserLimit }));
app.use(bodyParser.raw({ limit: config.BodyParserLimit }));
app.use(bodyParser.json({ limit: config.BodyParserLimit }));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: config.BodyParserLimit,
    parameterLimit: config.ParameterLimit,
  })
);
app.use(
  morgan(function (tokens, req, res) {
    let method = tokens.method(req, res);
    let url = tokens.url(req, res);
    let resptime = `${tokens["response-time"](req, res)} ms`;
    let time = moment().utcOffset(330).format(config.Common_Date_Time_Format);
    return ` ${chalk.gray(
      time
    )}   ${chalk.bold.greenBright(method)} ${chalk.yellowBright(url)}  ${chalk.yellowBright(resptime)} ${chalk.redBright("api-request")}`;
  })
);
app.use(CookieParser());
app.use("/", routes);

var cron = require('node-cron');
const CronController = require("./controllers/CronController");

var task = cron.schedule('* * * * *', async () => {
  try {
    CronController.Delete_Post_After_One_Hour()
} catch (error) {
    console.error("Some Cron Error--------->", error);
}
});

task.start();

app.use(async (req, res, next) => {
  let msg = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(`${req.protocol}://${req.get("host")}${req.originalUrl}`);
  let Result = {
    success: false,
    extras: { code: 2, msg: ApiMessages.API_NOT_AVAILABLE, Req: msg },
  };
  await ResponseController.Common_Response_Handler(res, Result);
});

app.listen(
  config.port,
  connectToDb(),
  console.log(`fintra server running on ${config.port}`)
);
