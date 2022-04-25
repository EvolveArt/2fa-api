const starknet = require("starknet");
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ACCOUNT_CONTRACT = process.env.ACCOUNT_CONTRACT;

const toLowerCase = (val) => {
	if (val) return val.toLowerCase();
	else return val;
};

const KEY_PAIR = starknet.ec.getKeyPair(PRIVATE_KEY);
const PUBLIC_KEY = starknet.ec.getStarkKey(KEY_PAIR);

const getSessionSigner = () => {
	let prov = new starknet.Provider({
		baseUrl: "https://hackathon-3.starknet.io",
	});
	let signer = new starknet.Account(prov, ACCOUNT_CONTRACT, KEY_PAIR);
	signer.estimateFee = async () => {
		return {
			amount: 0,
			unit: "wei",
		};
	};
	return signer;
};

module.exports = {
	toLowerCase,
	KEY_PAIR,
	getSessionSigner,
	ACCOUNT_CONTRACT,
	PUBLIC_KEY,
};
