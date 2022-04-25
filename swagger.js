const swaggerAutogen = require("swagger-autogen")();

const doc = {
	info: {
		version: "1.0.0", // by default: '1.0.0'
		title: "ZkPad API", // by default: 'REST API'
		description: "API for ZkPad", // by default: ''
	},
	host: "zkpad-api.herokuapp.com", // by default: 'localhost:3000'
	schemes: ["https"],
};

const outputFile = "./swagger_output.json";
const endpointsFiles = ["./apis/index.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
