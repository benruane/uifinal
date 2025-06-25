export const ABI_SEDA_FEE_MANAGER = [
	{
		inputs: [],
		name: "ArrayLengthMismatch",
		type: "error",
	},
	{
		inputs: [],
		name: "FeeAmountMismatch",
		type: "error",
	},
	{
		inputs: [],
		name: "FeeTransferFailed",
		type: "error",
	},
	{
		inputs: [],
		name: "InvalidRecipient",
		type: "error",
	},
	{
		inputs: [],
		name: "NoFeesToWithdraw",
		type: "error",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "recipient",
				type: "address",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256",
			},
		],
		name: "FeeAdded",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "recipient",
				type: "address",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256",
			},
		],
		name: "FeeWithdrawn",
		type: "event",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "recipient",
				type: "address",
			},
		],
		name: "addPendingFees",
		outputs: [],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address[]",
				name: "recipients",
				type: "address[]",
			},
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]",
			},
		],
		name: "addPendingFeesMultiple",
		outputs: [],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "getPendingFees",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		name: "pendingFees",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "withdrawFees",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;
