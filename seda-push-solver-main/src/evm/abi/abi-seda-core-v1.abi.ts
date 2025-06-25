export const ABI_SEDA_CORE_V1 = [
	{
		inputs: [],
		stateMutability: "nonpayable",
		type: "constructor",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "target",
				type: "address",
			},
		],
		name: "AddressEmptyCode",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "implementation",
				type: "address",
			},
		],
		name: "ERC1967InvalidImplementation",
		type: "error",
	},
	{
		inputs: [],
		name: "ERC1967NonPayable",
		type: "error",
	},
	{
		inputs: [],
		name: "EnforcedPause",
		type: "error",
	},
	{
		inputs: [],
		name: "ExpectedPause",
		type: "error",
	},
	{
		inputs: [],
		name: "FailedCall",
		type: "error",
	},
	{
		inputs: [],
		name: "FeeManagerRequired",
		type: "error",
	},
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
		inputs: [],
		name: "InvalidInitialization",
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
		inputs: [
			{
				internalType: "bytes32",
				name: "drId",
				type: "bytes32",
			},
			{
				internalType: "uint256",
				name: "resultTimestamp",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "requestTimestamp",
				type: "uint256",
			},
		],
		name: "InvalidResultTimestamp",
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
		inputs: [],
		name: "NotInitializing",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address",
			},
		],
		name: "OwnableInvalidOwner",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "OwnableUnauthorizedAccount",
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
		inputs: [],
		name: "UUPSUnauthorizedCallContext",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "slot",
				type: "bytes32",
			},
		],
		name: "UUPSUnsupportedProxiableUUID",
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
				indexed: false,
				internalType: "uint64",
				name: "version",
				type: "uint64",
			},
		],
		name: "Initialized",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "previousOwner",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "newOwner",
				type: "address",
			},
		],
		name: "OwnershipTransferred",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "Paused",
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
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "Unpaused",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "implementation",
				type: "address",
			},
		],
		name: "Upgraded",
		type: "event",
	},
	{
		inputs: [],
		name: "UPGRADE_INTERFACE_VERSION",
		outputs: [
			{
				internalType: "string",
				name: "",
				type: "string",
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
		name: "deriveRequestId",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "pure",
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
		],
		name: "deriveResultId",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "pure",
		type: "function",
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
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
		],
		name: "getPendingRequestDetails",
		outputs: [
			{
				components: [
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
					{
						internalType: "uint256",
						name: "gasLimit",
						type: "uint256",
					},
					{
						internalType: "address",
						name: "requestFeeAddr",
						type: "address",
					},
					{
						internalType: "address",
						name: "resultFeeAddr",
						type: "address",
					},
					{
						internalType: "address",
						name: "batchFeeAddr",
						type: "address",
					},
				],
				internalType: "struct SedaCoreV1.RequestDetails",
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
				name: "requestId",
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
		inputs: [],
		name: "getTimeoutPeriod",
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
				internalType: "bytes32",
				name: "requestId",
				type: "bytes32",
			},
		],
		name: "hasResult",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
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
				name: "newRequestFee",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "newResultFee",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "newBatchFee",
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
				internalType: "address",
				name: "sedaProverAddress",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "initialTimeoutPeriod",
				type: "uint256",
			},
		],
		name: "initialize",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "owner",
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
		name: "pause",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "paused",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
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
	{
		inputs: [],
		name: "proxiableUUID",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "renounceOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "newTimeoutPeriod",
				type: "uint256",
			},
		],
		name: "setTimeoutPeriod",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "newOwner",
				type: "address",
			},
		],
		name: "transferOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "unpause",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "newImplementation",
				type: "address",
			},
			{
				internalType: "bytes",
				name: "data",
				type: "bytes",
			},
		],
		name: "upgradeToAndCall",
		outputs: [],
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
		name: "verifyResult",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32",
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
		name: "withdrawTimedOutRequest",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;
