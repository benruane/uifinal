export const I_SEDA_CORE = [
	{
		inputs: [],
		name: "FeeTransferFailed",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "providedFee",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "expectedFee",
				type: "uint256",
			},
		],
		name: "InvalidFeeAmount",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "string",
				name: "parameterName",
				type: "string",
			},
			{
				internalType: "uint256",
				name: "value",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "minimumRequired",
				type: "uint256",
			},
		],
		name: "InvalidParameter",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "resultId",
				type: "bytes32",
			},
		],
		name: "InvalidResultProof",
		type: "error",
	},
	{
		inputs: [],
		name: "InvalidTimeoutPeriod",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
		],
		name: "NoFeesUpdated",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
		],
		name: "RequestAlreadyExists",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
		],
		name: "RequestAlreadyResolved",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
		],
		name: "RequestNotFound",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "currentTime",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "timeoutTime",
				type: "uint256",
			},
		],
		name: "RequestNotTimedOut",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
		],
		name: "ResultAlreadyExists",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
		],
		name: "ResultNotFound",
		type: "error",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
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
			{
				indexed: true,
				internalType: "enum ISedaCore.FeeType",
				name: "feeType",
				type: "uint8",
			},
		],
		name: "FeeDistributed",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "enum ISedaCore.FeeType",
				name: "feeType",
				type: "uint8",
			},
		],
		name: "FeeUpdated",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
		],
		name: "RequestPosted",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "resultId",
				type: "bytes32",
			},
		],
		name: "ResultPosted",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "newTimeoutPeriod",
				type: "uint256",
			},
		],
		name: "TimeoutPeriodUpdated",
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
		inputs: [
			{
				internalType: "uint256",
				name: "offset",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "limit",
				type: "uint256",
			},
		],
		name: "getPendingRequests",
		outputs: [
			{
				components: [
					{
						internalType: "bytes32",
						name: "id",
						type: "bytes32",
					},
					{
						components: [
							{
								internalType: "string",
								name: "version",
								type: "string",
							},
							{
								internalType: "bytes32",
								name: "execProgramId",
								type: "bytes32",
							},
							{
								internalType: "bytes",
								name: "execInputs",
								type: "bytes",
							},
							{
								internalType: "uint64",
								name: "execGasLimit",
								type: "uint64",
							},
							{
								internalType: "bytes32",
								name: "tallyProgramId",
								type: "bytes32",
							},
							{
								internalType: "bytes",
								name: "tallyInputs",
								type: "bytes",
							},
							{
								internalType: "uint64",
								name: "tallyGasLimit",
								type: "uint64",
							},
							{
								internalType: "uint16",
								name: "replicationFactor",
								type: "uint16",
							},
							{
								internalType: "bytes",
								name: "consensusFilter",
								type: "bytes",
							},
							{
								internalType: "uint128",
								name: "gasPrice",
								type: "uint128",
							},
							{
								internalType: "bytes",
								name: "memo",
								type: "bytes",
							},
						],
						internalType: "struct SedaDataTypes.Request",
						name: "request",
						type: "tuple",
					},
					{
						internalType: "address",
						name: "requestor",
						type: "address",
					},
					{
						internalType: "uint256",
						name: "timestamp",
						type: "uint256",
					},
					{
						internalType: "uint256",
						name: "requestFee",
						type: "uint256",
					},
					{
						internalType: "uint256",
						name: "resultFee",
						type: "uint256",
					},
					{
						internalType: "uint256",
						name: "batchFee",
						type: "uint256",
					},
				],
				internalType: "struct ISedaCore.PendingRequest[]",
				name: "",
				type: "tuple[]",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "id",
				type: "bytes32",
			},
		],
		name: "getRequest",
		outputs: [
			{
				components: [
					{
						internalType: "string",
						name: "version",
						type: "string",
					},
					{
						internalType: "bytes32",
						name: "execProgramId",
						type: "bytes32",
					},
					{
						internalType: "bytes",
						name: "execInputs",
						type: "bytes",
					},
					{
						internalType: "uint64",
						name: "execGasLimit",
						type: "uint64",
					},
					{
						internalType: "bytes32",
						name: "tallyProgramId",
						type: "bytes32",
					},
					{
						internalType: "bytes",
						name: "tallyInputs",
						type: "bytes",
					},
					{
						internalType: "uint64",
						name: "tallyGasLimit",
						type: "uint64",
					},
					{
						internalType: "uint16",
						name: "replicationFactor",
						type: "uint16",
					},
					{
						internalType: "bytes",
						name: "consensusFilter",
						type: "bytes",
					},
					{
						internalType: "uint128",
						name: "gasPrice",
						type: "uint128",
					},
					{
						internalType: "bytes",
						name: "memo",
						type: "bytes",
					},
				],
				internalType: "struct SedaDataTypes.Request",
				name: "",
				type: "tuple",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
		],
		name: "getResult",
		outputs: [
			{
				components: [
					{
						internalType: "string",
						name: "version",
						type: "string",
					},
					{
						internalType: "bytes32",
						name: "drId",
						type: "bytes32",
					},
					{
						internalType: "bool",
						name: "consensus",
						type: "bool",
					},
					{
						internalType: "uint8",
						name: "exitCode",
						type: "uint8",
					},
					{
						internalType: "bytes",
						name: "result",
						type: "bytes",
					},
					{
						internalType: "uint64",
						name: "blockHeight",
						type: "uint64",
					},
					{
						internalType: "uint64",
						name: "blockTimestamp",
						type: "uint64",
					},
					{
						internalType: "uint128",
						name: "gasUsed",
						type: "uint128",
					},
					{
						internalType: "bytes",
						name: "paybackAddress",
						type: "bytes",
					},
					{
						internalType: "bytes",
						name: "sedaPayload",
						type: "bytes",
					},
				],
				internalType: "struct SedaDataTypes.Result",
				name: "",
				type: "tuple",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "getSedaProver",
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
		inputs: [
			{
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "additionalRequestFee",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "additionalResultFee",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "additionalBatchFee",
				type: "uint256",
			},
		],
		name: "increaseFees",
		outputs: [],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "bytes32",
						name: "execProgramId",
						type: "bytes32",
					},
					{
						internalType: "bytes",
						name: "execInputs",
						type: "bytes",
					},
					{
						internalType: "uint64",
						name: "execGasLimit",
						type: "uint64",
					},
					{
						internalType: "bytes32",
						name: "tallyProgramId",
						type: "bytes32",
					},
					{
						internalType: "bytes",
						name: "tallyInputs",
						type: "bytes",
					},
					{
						internalType: "uint64",
						name: "tallyGasLimit",
						type: "uint64",
					},
					{
						internalType: "uint16",
						name: "replicationFactor",
						type: "uint16",
					},
					{
						internalType: "bytes",
						name: "consensusFilter",
						type: "bytes",
					},
					{
						internalType: "uint128",
						name: "gasPrice",
						type: "uint128",
					},
					{
						internalType: "bytes",
						name: "memo",
						type: "bytes",
					},
				],
				internalType: "struct SedaDataTypes.RequestInputs",
				name: "inputs",
				type: "tuple",
			},
			{
				internalType: "uint256",
				name: "requestFee",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "resultFee",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "batchFee",
				type: "uint256",
			},
		],
		name: "postRequest",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "bytes32",
						name: "execProgramId",
						type: "bytes32",
					},
					{
						internalType: "bytes",
						name: "execInputs",
						type: "bytes",
					},
					{
						internalType: "uint64",
						name: "execGasLimit",
						type: "uint64",
					},
					{
						internalType: "bytes32",
						name: "tallyProgramId",
						type: "bytes32",
					},
					{
						internalType: "bytes",
						name: "tallyInputs",
						type: "bytes",
					},
					{
						internalType: "uint64",
						name: "tallyGasLimit",
						type: "uint64",
					},
					{
						internalType: "uint16",
						name: "replicationFactor",
						type: "uint16",
					},
					{
						internalType: "bytes",
						name: "consensusFilter",
						type: "bytes",
					},
					{
						internalType: "uint128",
						name: "gasPrice",
						type: "uint128",
					},
					{
						internalType: "bytes",
						name: "memo",
						type: "bytes",
					},
				],
				internalType: "struct SedaDataTypes.RequestInputs",
				name: "inputs",
				type: "tuple",
			},
		],
		name: "postRequest",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "string",
						name: "version",
						type: "string",
					},
					{
						internalType: "bytes32",
						name: "drId",
						type: "bytes32",
					},
					{
						internalType: "bool",
						name: "consensus",
						type: "bool",
					},
					{
						internalType: "uint8",
						name: "exitCode",
						type: "uint8",
					},
					{
						internalType: "bytes",
						name: "result",
						type: "bytes",
					},
					{
						internalType: "uint64",
						name: "blockHeight",
						type: "uint64",
					},
					{
						internalType: "uint64",
						name: "blockTimestamp",
						type: "uint64",
					},
					{
						internalType: "uint128",
						name: "gasUsed",
						type: "uint128",
					},
					{
						internalType: "bytes",
						name: "paybackAddress",
						type: "bytes",
					},
					{
						internalType: "bytes",
						name: "sedaPayload",
						type: "bytes",
					},
				],
				internalType: "struct SedaDataTypes.Result",
				name: "result",
				type: "tuple",
			},
			{
				internalType: "uint64",
				name: "batchHeight",
				type: "uint64",
			},
			{
				internalType: "bytes32[]",
				name: "proof",
				type: "bytes32[]",
			},
		],
		name: "postResult",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;
