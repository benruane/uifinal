export const ABI_SECP256K1_PROVER_V1 = [
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
				internalType: "uint64",
				name: "height",
				type: "uint64",
			},
		],
		name: "BatchAlreadyExists",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "uint64",
				name: "batchHeight",
				type: "uint64",
			},
			{
				internalType: "uint64",
				name: "lastBatchHeight",
				type: "uint64",
			},
			{
				internalType: "uint64",
				name: "maxAge",
				type: "uint64",
			},
		],
		name: "BatchHeightTooOld",
		type: "error",
	},
	{
		inputs: [],
		name: "ConsensusNotReached",
		type: "error",
	},
	{
		inputs: [],
		name: "ECDSAInvalidSignature",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "length",
				type: "uint256",
			},
		],
		name: "ECDSAInvalidSignatureLength",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "s",
				type: "bytes32",
			},
		],
		name: "ECDSAInvalidSignatureS",
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
		name: "InvalidInitialization",
		type: "error",
	},
	{
		inputs: [],
		name: "InvalidSignature",
		type: "error",
	},
	{
		inputs: [],
		name: "InvalidValidatorOrder",
		type: "error",
	},
	{
		inputs: [],
		name: "InvalidValidatorProof",
		type: "error",
	},
	{
		inputs: [],
		name: "MismatchedSignaturesAndProofs",
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
		name: "CONSENSUS_PERCENTAGE",
		outputs: [
			{
				internalType: "uint32",
				name: "",
				type: "uint32",
			},
		],
		stateMutability: "view",
		type: "function",
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
				internalType: "uint64",
				name: "batchHeight",
				type: "uint64",
			},
		],
		name: "getBatch",
		outputs: [
			{
				components: [
					{
						internalType: "bytes32",
						name: "resultsRoot",
						type: "bytes32",
					},
					{
						internalType: "address",
						name: "sender",
						type: "address",
					},
				],
				internalType: "struct Secp256k1ProverV1.BatchData",
				name: "",
				type: "tuple",
			},
		],
		stateMutability: "view",
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
		inputs: [],
		name: "getLastValidatorsRoot",
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
		name: "getMaxBatchAge",
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
				name: "initialBatch",
				type: "tuple",
			},
			{
				internalType: "uint64",
				name: "maxBatchAge",
				type: "uint64",
			},
			{
				internalType: "address",
				name: "feeManager",
				type: "address",
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
