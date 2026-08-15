// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice BountyMint escrows a bounty reward, records Commit/Reveal submissions from
/// three fixed Creator Agent slots, and atomically pays the winner while minting the
/// winning artwork as an ERC-721 to the bounty creator.
contract BountyMint is ERC721URIStorage, Ownable, ReentrancyGuard {
    /// @dev Agent IDs are 1-indexed (1..AGENT_COUNT) to match the PRD/API convention
    /// where Creator Agents are numbered PixelForge=1, NeonMuse=2, MythicAI=3.
    uint8 public constant AGENT_COUNT = 3;

    enum BountyStatus {
        Open,
        Creating,
        Revealed,
        Awarded,
        Cancelled
    }

    struct Bounty {
        address creator;
        uint256 reward;
        bytes32 promptHash;
        uint64 deadline;
        BountyStatus status;
        uint8 commitCount;
        uint8 revealCount;
        uint8 winningAgentId;
        uint256 tokenId;
    }

    struct Submission {
        bytes32 commitHash;
        bytes32 imageHash;
        string metadataURI;
        address payoutAddress;
        bool revealed;
    }

    address public executor;
    uint256 public nextBountyId;
    uint256 public nextTokenId;

    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => mapping(uint8 => Submission)) public submissions;

    event ExecutorUpdated(address indexed previousExecutor, address indexed newExecutor);
    event BountyCreated(
        uint256 indexed bountyId, address indexed creator, uint256 reward, bytes32 promptHash, uint64 deadline
    );
    event WorkCommitted(uint256 indexed bountyId, uint8 indexed agentId, bytes32 commitHash, address payoutAddress);
    event WorkRevealed(uint256 indexed bountyId, uint8 indexed agentId, bytes32 imageHash, string metadataURI);
    event WinnerAwarded(uint256 indexed bountyId, uint8 indexed agentId, uint256 indexed tokenId, uint256 reward);
    event BountyRefunded(uint256 indexed bountyId, address indexed creator, uint256 amount);

    constructor(address initialExecutor, address initialOwner)
        ERC721("BountyMint", "BMINT")
        Ownable(initialOwner)
    {
        require(initialExecutor != address(0), "BountyMint: zero executor");
        executor = initialExecutor;
    }

    modifier onlyExecutor() {
        require(msg.sender == executor, "BountyMint: not executor");
        _;
    }

    modifier onlyValidAgent(uint8 agentId) {
        require(agentId >= 1 && agentId <= AGENT_COUNT, "BountyMint: invalid agent");
        _;
    }

    function setExecutor(address newExecutor) external onlyOwner {
        require(newExecutor != address(0), "BountyMint: zero executor");
        emit ExecutorUpdated(executor, newExecutor);
        executor = newExecutor;
    }

    function createBounty(bytes32 promptHash, uint64 deadline) external payable returns (uint256 bountyId) {
        require(msg.value > 0, "BountyMint: zero reward");
        require(deadline > block.timestamp, "BountyMint: deadline must be future");

        bountyId = nextBountyId++;
        Bounty storage bounty = bounties[bountyId];
        bounty.creator = msg.sender;
        bounty.reward = msg.value;
        bounty.promptHash = promptHash;
        bounty.deadline = deadline;
        bounty.status = BountyStatus.Open;

        emit BountyCreated(bountyId, msg.sender, msg.value, promptHash, deadline);
    }

    function commitWork(uint256 bountyId, uint8 agentId, bytes32 commitHash, address payoutAddress)
        external
        onlyExecutor
        onlyValidAgent(agentId)
    {
        require(payoutAddress != address(0), "BountyMint: zero payout address");
        require(commitHash != bytes32(0), "BountyMint: zero commit hash");

        Bounty storage bounty = bounties[bountyId];
        require(bounty.creator != address(0), "BountyMint: bounty not found");
        require(
            bounty.status == BountyStatus.Open || bounty.status == BountyStatus.Creating,
            "BountyMint: bounty not open"
        );
        require(block.timestamp <= bounty.deadline, "BountyMint: bounty expired");

        Submission storage submission = submissions[bountyId][agentId];
        require(submission.commitHash == bytes32(0), "BountyMint: already committed");

        submission.commitHash = commitHash;
        submission.payoutAddress = payoutAddress;

        if (bounty.status == BountyStatus.Open) {
            bounty.status = BountyStatus.Creating;
        }
        bounty.commitCount += 1;

        emit WorkCommitted(bountyId, agentId, commitHash, payoutAddress);
    }

    function revealWork(uint256 bountyId, uint8 agentId, bytes32 imageHash, string calldata metadataURI, bytes32 salt)
        external
        onlyExecutor
        onlyValidAgent(agentId)
    {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.commitCount == AGENT_COUNT, "BountyMint: commits incomplete");
        require(
            bounty.status != BountyStatus.Awarded && bounty.status != BountyStatus.Cancelled,
            "BountyMint: bounty finalized"
        );
        require(block.timestamp <= bounty.deadline, "BountyMint: bounty expired");

        Submission storage submission = submissions[bountyId][agentId];
        require(submission.commitHash != bytes32(0), "BountyMint: not committed");
        require(!submission.revealed, "BountyMint: already revealed");

        bytes32 expectedHash =
            keccak256(abi.encode(bountyId, agentId, imageHash, keccak256(bytes(metadataURI)), salt));
        require(expectedHash == submission.commitHash, "BountyMint: commit mismatch");

        submission.imageHash = imageHash;
        submission.metadataURI = metadataURI;
        submission.revealed = true;
        bounty.revealCount += 1;

        if (bounty.revealCount == AGENT_COUNT) {
            bounty.status = BountyStatus.Revealed;
        }

        emit WorkRevealed(bountyId, agentId, imageHash, metadataURI);
    }

    function awardWinner(uint256 bountyId, uint8 agentId) external nonReentrant onlyValidAgent(agentId) {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.creator, "BountyMint: not creator");
        require(bounty.status == BountyStatus.Revealed, "BountyMint: not revealed");

        Submission storage submission = submissions[bountyId][agentId];
        require(submission.revealed, "BountyMint: work not revealed");

        bounty.status = BountyStatus.Awarded;
        bounty.winningAgentId = agentId;
        uint256 tokenId = nextTokenId++;
        bounty.tokenId = tokenId;
        uint256 reward = bounty.reward;
        address payoutAddress = submission.payoutAddress;
        string memory metadataURI = submission.metadataURI;
        address creator = bounty.creator;

        (bool sent,) = payoutAddress.call{value: reward}("");
        require(sent, "BountyMint: payment failed");

        _safeMint(creator, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit WinnerAwarded(bountyId, agentId, tokenId, reward);
    }

    function refundExpiredBounty(uint256 bountyId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.creator, "BountyMint: not creator");
        require(block.timestamp > bounty.deadline, "BountyMint: not expired");
        require(
            bounty.status != BountyStatus.Awarded && bounty.status != BountyStatus.Cancelled,
            "BountyMint: cannot refund"
        );

        bounty.status = BountyStatus.Cancelled;
        uint256 amount = bounty.reward;
        address creator = bounty.creator;

        (bool sent,) = payable(creator).call{value: amount}("");
        require(sent, "BountyMint: refund failed");

        emit BountyRefunded(bountyId, creator, amount);
    }
}
