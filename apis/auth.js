require("dotenv").config();
const jwt = require("jsonwebtoken");
const jwt_secret = process.env.JWT_SECRET;
const router = require("express").Router();
const ethers = require("ethers");
const mongoose = require("mongoose");
const Account = mongoose.model("Account");
const {
	toLowerCase,
	getSessionSigner,
	ACCOUNT_CONTRACT,
	PUBLIC_KEY,
} = require("../utils/utils");
const Logger = require("../services/logger");
const starknet = require("starknet");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = require("twilio")(accountSid, authToken);

router.post("/getToken", async (req, res) => {
	let address = req.body.address;
	let isAddress = ethers.utils.isAddress(address);
	if (!isAddress)
		return res.json({
			status: "failed",
			token: "",
		});
	address = toLowerCase(address);
	// save a new account if not registered
	let account = await Account.findOne({ address: address });
	if (!account) {
		try {
			let newAccount = new Account();
			newAccount.address = address;
			await newAccount.save();
		} catch (error) {}
	}

	let token = jwt.sign(
		{
			data: address,
		},
		jwt_secret,
		{ expiresIn: "24h" }
	);
	return res.json({
		status: "success",
		token: token,
	});
});

router.post("/sendCode", async (req, res) => {
	try {
		let phoneNumber = req.body.phoneNumber;

		let code = Math.random().toString().slice(2, 11);
		let hash_code = starknet.hash.computeHashOnElements(code);

		console.log(PUBLIC_KEY);

		const signer = getSessionSigner();
		signer.execute({
			contractAddress: ACCOUNT_CONTRACT,
			entrypoint: "save_hash",
			calldata: [hash_code],
		});

		await client.messages.create({
			body: `gm! here is your 2FArgent Code fren ❤️ ${code}`,
			from: "+19803243317",
			to: phoneNumber,
		});
		return res.json({ status: "success" });
	} catch (error) {
		console.error(error);
		return res.json({ status: "failed", error });
	}
});

module.exports = router;
