export const I_PROVER = [
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "uint256",
				name: "batchHeight",
				type: "uint256",
			},
			{
				indexed: true,
				internalType: "bytes32",
				name: "batchHash",
				type: "bytes32",
			},
			{
				indexed: true,
				internalType: "address",
				name: "sender",
				type: "address",
			},
		],
		name: "BatchPosted",
		type: "event",
	},
	{
		inputs: [],
		name: "getFeeManager",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "getLastBatchHeight",
		outputs: [
			{
				internalType: "uint64",
				name: "",
				type: "uint64",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "uint64",
						name: "batchHeight",
						type: "uint64",
					},
					{
						internalType: "uint64",
						name: "blockHeight",
						type: "uint64",
					},
					{
						internalType: "bytes32",
						name: "validatorsRoot",
						type: "bytes32",
					},
					{
						internalType: "bytes32",
						name: "resultsRoot",
						type: "bytes32",
					},
					{
						internalType: "bytes32",
						name: "provingMetadata",
						type: "bytes32",
					},
				],
				internalType: "struct SedaDataTypes.Batch",
				name: "newBatch",
				type: "tuple",
			},
			{
				internalType: "bytes[]",
				name: "signatures",
				type: "bytes[]",
			},
			{
				components: [
					{
						internalType: "uint32",
						name: "votingPower",
						type: "uint32",
					},
					{
						internalType: "address",
						name: "signer",
						type: "address",
					},
					{
						internalType: "bytes32[]",
						name: "merkleProof",
						type: "bytes32[]",
					},
				],
				internalType: "struct SedaDataTypes.ValidatorProof[]",
				name: "validatorProofs",
				type: "tuple[]",
			},
		],
		name: "postBatch",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "resultId",
				type: "bytes32",
			},
			{
				internalType: "uint64",
				name: "batchHeight",
				type: "uint64",
			},
			{
				internalType: "bytes32[]",
				name: "merkleProof",
				type: "bytes32[]",
			},
		],
		name: "verifyResultProof",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
] as const;
