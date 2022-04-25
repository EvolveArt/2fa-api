const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const port = process.env.PORT || 5001;
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger_output.json");

const Logger = require("./services/logger");
const morganMiddleware = require("./apis/middleware/morgan");
// const fs = require("fs");

require("./models/abi");
require("./models/account");

// const connect = () => {
// 	const uri = process.env.DB_URL;

// 	mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// 	const db = mongoose.connection;
// 	db.on("error", console.error.bind(console, "connection error:"));
// 	db.once("open", function () {
// 		Logger.info("zkpad server has been connected to the db server");
// 		app.listen(port, () => {
// 			Logger.info(`zkpad server is running at port ${port}`);
// 		});
// 	});
// };

app.use(
	bodyParser.urlencoded({
		extended: false,
	})
);
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());
app.options("*", cors()); // include before other routes

app.use(morganMiddleware);
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use((req, res, next) => {
	const render = res.render;
	const send = res.send;
	res.render = function renderWrapper(...args) {
		Error.captureStackTrace(this);
		return render.apply(this, args);
	};
	res.send = function sendWrapper(...args) {
		try {
			send.apply(this, args);
		} catch (err) {
			console.error(
				`Error in res.send | ${err.code} | ${err.message} | ${res.stack}`
			);
		}
	};
	next();
});

app.use(require("./apis"));
app.listen(port, () => {
	Logger.info(`2fa server is running at port ${port}`);
});
