require("dotenv").config();
const fs = require("fs");
const formidable = require("formidable");
const router = require("express").Router();
const ethers = require("ethers");
const mongoose = require("mongoose");

const Logger = require("../services/logger");
const auth = require("./middleware/auth");
const Account = mongoose.model("Account");

const validateSignature = require("../apis/middleware/auth.sign");

const pinataSDK = require("@pinata/sdk");
const pinata = pinataSDK(
	process.env.PINATA_API_KEY,
	process.env.PINATA_SECRET_API_KEY
);

const { toLowerCase } = require("../utils/utils");

const extractAddress = require("../services/address.utils");

const uploadPath = process.env.UPLOAD_PATH;

const pinAccountAvatar = async (account, imgData, userName, address, res) => {
	// check wether the account is new or already existing one -> unpin the file
	address = toLowerCase(address);
	if (account) {
		let hash = account.imageHash;
		try {
			await pinata.unpin(hash);
		} catch (error) {}
	}
	let extension = imgData.substring(
		"data:image/".length,
		imgData.indexOf(";base64")
	);
	let fileName = `${userName}${address}.${extension}`;
	let base64Data = imgData.replace(`data:image\/${extension};base64,`, "");
	fs.writeFile(uploadPath + fileName, base64Data, "base64", (err) => {
		if (err) {
			return res.status(400).json({
				status: "failed to save an image 1",
			});
		}
	});

	const pinataOptions = {
		pinataMetadata: {
			name: userName + address + "avatar",
			keyvalues: {
				address: address,
				userName: userName,
			},
		},
		pinataOptions: {
			cidVersion: 0,
		},
	};
	const readableStreamForFile = fs.createReadStream(uploadPath + fileName);
	try {
		let result = await pinata.pinFileToIPFS(
			readableStreamForFile,
			pinataOptions
		);
		// remove file once pinned
		try {
			fs.unlinkSync(uploadPath + fileName);
		} catch (error) {}
		return result.IpfsHash;
	} catch (error) {
		Logger.error(error.message);
		return res.status(400).json({
			status: "failed to save an image 2",
		});
	}
};

// update the account alias or if not registered, create a new account
router.post("/accountdetails", auth, async (req, res) => {
	let form = new formidable.IncomingForm();
	form.parse(req, async (err, fields, files) => {
		if (err) {
			Logger.error(err.message);
			return res.status(400).json({
				status: "failed",
				data: 0,
			});
		}
		let address = extractAddress(req, res);
		let alias = fields.alias;
		let email = fields.email;
		let bio = fields.bio;
		let imgData = fields.imgData;
		let signature = fields.signature;
		let retrievedAddr = fields.signatureAddress;
		let isValidsignature = await validateSignature(
			address,
			signature,
			retrievedAddr
		);
		if (!isValidsignature)
			return res.status(400).json({
				status: "invalid signature",
			});
		let account = await Account.findOne({ address: address });
		if (imgData) {
			if (imgData.startsWith("https")) {
				if (account) {
					account.alias = alias;
					account.email = email;
					account.bio = bio;
					let _account = await account.save();
					return res.json({
						status: "success",
						data: _account,
					});
				} else {
					return res.status(400).json({
						status: "failed",
						data: 1,
					});
				}
			} else {
				let ipfsHash = await pinAccountAvatar(
					account,
					imgData,
					alias,
					address,
					res
				);
				if (account) {
					account.alias = alias;
					account.email = email;
					account.bio = bio;
					account.imageHash = ipfsHash;
					let _account = await account.save();
					return res.json({
						status: "success",
						data: _account.toAccountJSON(),
					});
				} else {
					let newAccount = new Account();
					newAccount.address = address;
					newAccount.alias = alias;
					newAccount.email = email;
					newAccount.bio = bio;
					newAccount.imageHash = ipfsHash;
					let _account = await newAccount.save();
					return res.json({
						status: "success",
						data: _account.toAccountJSON(),
					});
				}
			}
		} else {
			if (account) {
				account.alias = alias;
				account.email = email;
				account.bio = bio;
				let _account = await account.save();
				return res.json({
					status: "success",
					data: _account.toAccountJSON(),
				});
			} else {
				let account = new Account();
				account.address = address;
				account.alias = alias;
				account.email = email;
				account.bio = bio;
				let _account = await account.save();
				return res.json({
					status: "success",
					data: _account.toAccountJSON(),
				});
			}
		}
	});
});

// get account info by address

router.get("/getaccountinfo", auth, async (req, res) => {
	let address = extractAddress(req);
	let account = await Account.findOne({ address: address });
	if (account) {
		return res.json({
			status: "success",
			data: account.toAccountJSON(),
		});
	} else {
		return res.status(400).json({
			status: "failed",
		});
	}
});

// get account info by address

router.post("/getuseraccountinfo", async (req, res) => {
	let address = req.body.address;
	if (!ethers.utils.isAddress(address))
		return res.json({
			status: "failed",
			data: "invalid frc20 address",
		});
	address = toLowerCase(address);
	let account = await Account.findOne({ address: address });
	if (account) {
		return res.json({
			status: "success",
			data: {
				address: account.address,
				firstname: account.firstname,
				lastname: account.lastname,
				description: account.description,
				imageHash: account.imageHash,
			},
		});
	} else {
		return res.json({
			status: "success",
		});
	}
});

router.get("/nonce/:address", auth, async (req, res) => {
	try {
		let address = toLowerCase(req.params.address);
		if (!ethers.utils.isAddress(address))
			return res.json({
				status: "failed",
				data: "invalid erc20 address",
			});
		let account = await Account.findOne({ address: address });
		if (account) {
			return res.json({
				status: "success",
				data: account.nonce,
			});
		} else {
			let _account = new Account();
			_account.address = address;
			_account.nonce = Math.floor(Math.random() * 9999999);
			let __account = await _account.save();
			return res.json({
				status: "success",
				data: __account.nonce,
			});
		}
	} catch (error) {
		return res.json({
			status: "failed",
		});
	}
});

module.exports = router;
