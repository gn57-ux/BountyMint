// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {BountyMint} from "../src/BountyMint.sol";

contract ReentrantPayoutAttacker {
    BountyMint public target;
    uint256 public bountyId;
    uint8 public agentId;
    bool public attacked;

    constructor(BountyMint _target) {
        target = _target;
    }

    function setTarget(uint256 _bountyId, uint8 _agentId) external {
        bountyId = _bountyId;
        agentId = _agentId;
    }

    receive() external payable {
        if (!attacked) {
            attacked = true;
            target.awardWinner(bountyId, agentId);
        }
    }
}

contract BountyMintTest is Test {
    BountyMint bounty;

    address owner = makeAddr("owner");
    address executor = makeAddr("executor");
    address creator = makeAddr("creator");
    // Agent IDs are 1-indexed (1=PixelForge, 2=NeonMuse, 3=MythicAI) to match the PRD/API.
    address agent1Payout = makeAddr("agent1Payout");
    address agent2Payout = makeAddr("agent2Payout");
    address agent3Payout = makeAddr("agent3Payout");

    bytes32 constant PROMPT_HASH = keccak256("cyberpunk guardian beast");
    uint256 constant REWARD = 1 ether;

    function setUp() public {
        bounty = new BountyMint(executor, owner);
        vm.deal(creator, 10 ether);
    }

    function _createBounty() internal returns (uint256 bountyId) {
        vm.prank(creator);
        bountyId = bounty.createBounty{value: REWARD}(PROMPT_HASH, uint64(block.timestamp + 1 hours));
    }

    function _commitHash(uint256 bountyId, uint8 agentId, bytes32 imageHash, string memory metadataURI, bytes32 salt)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(bountyId, agentId, imageHash, keccak256(bytes(metadataURI)), salt));
    }

    function _commitAndRevealAll(uint256 bountyId)
        internal
        returns (bytes32[3] memory imageHashes, string[3] memory uris, bytes32[3] memory salts)
    {
        address[3] memory payouts = [agent1Payout, agent2Payout, agent3Payout];
        for (uint8 i = 0; i < 3; i++) {
            uint8 agentId = i + 1;
            imageHashes[i] = keccak256(abi.encodePacked("image", agentId));
            uris[i] = string(abi.encodePacked("ipfs://metadata", agentId));
            salts[i] = keccak256(abi.encodePacked("salt", agentId));

            bytes32 commitHash = _commitHash(bountyId, agentId, imageHashes[i], uris[i], salts[i]);
            vm.prank(executor);
            bounty.commitWork(bountyId, agentId, commitHash, payouts[i]);
        }
        for (uint8 i = 0; i < 3; i++) {
            uint8 agentId = i + 1;
            vm.prank(executor);
            bounty.revealWork(bountyId, agentId, imageHashes[i], uris[i], salts[i]);
        }
    }

    /* ---------------------------------------------------------------- */
    /* createBounty                                                       */
    /* ---------------------------------------------------------------- */

    function test_createBounty_locksRewardAndSetsOpenStatus() public {
        uint256 bountyId = _createBounty();
        (address bCreator, uint256 reward,,, BountyMint.BountyStatus status,,,,) = bounty.bounties(bountyId);

        assertEq(bCreator, creator);
        assertEq(reward, REWARD);
        assertEq(uint8(status), uint8(BountyMint.BountyStatus.Open));
        assertEq(address(bounty).balance, REWARD);
    }

    function test_createBounty_revertsOnZeroReward() public {
        vm.prank(creator);
        vm.expectRevert(bytes("BountyMint: zero reward"));
        bounty.createBounty(PROMPT_HASH, uint64(block.timestamp + 1 hours));
    }

    function test_createBounty_revertsOnPastDeadline() public {
        vm.warp(1000);
        vm.prank(creator);
        vm.expectRevert(bytes("BountyMint: deadline must be future"));
        bounty.createBounty{value: REWARD}(PROMPT_HASH, uint64(block.timestamp));
    }

    /* ---------------------------------------------------------------- */
    /* commitWork                                                         */
    /* ---------------------------------------------------------------- */

    function test_commitWork_onlyExecutor() public {
        uint256 bountyId = _createBounty();
        bytes32 commitHash = _commitHash(bountyId, 1, keccak256("img"), "ipfs://meta", keccak256("salt"));

        vm.prank(creator);
        vm.expectRevert(bytes("BountyMint: not executor"));
        bounty.commitWork(bountyId, 1, commitHash, agent1Payout);
    }

    function test_commitWork_revertsOnDuplicateCommit() public {
        uint256 bountyId = _createBounty();
        bytes32 commitHash = _commitHash(bountyId, 1, keccak256("img"), "ipfs://meta", keccak256("salt"));

        vm.prank(executor);
        bounty.commitWork(bountyId, 1, commitHash, agent1Payout);

        vm.prank(executor);
        vm.expectRevert(bytes("BountyMint: already committed"));
        bounty.commitWork(bountyId, 1, commitHash, agent1Payout);
    }

    function test_commitWork_incrementsCommitCountAndSetsCreating() public {
        uint256 bountyId = _createBounty();
        bytes32 commitHash = _commitHash(bountyId, 1, keccak256("img"), "ipfs://meta", keccak256("salt"));

        vm.prank(executor);
        bounty.commitWork(bountyId, 1, commitHash, agent1Payout);

        (,,,, BountyMint.BountyStatus status, uint8 commitCount,,,) = bounty.bounties(bountyId);
        assertEq(uint8(status), uint8(BountyMint.BountyStatus.Creating));
        assertEq(commitCount, 1);
    }

    function test_commitWork_revertsOnAgentIdZero() public {
        uint256 bountyId = _createBounty();
        bytes32 commitHash = _commitHash(bountyId, 0, keccak256("img"), "ipfs://meta", keccak256("salt"));

        vm.prank(executor);
        vm.expectRevert(bytes("BountyMint: invalid agent"));
        bounty.commitWork(bountyId, 0, commitHash, agent1Payout);
    }

    function test_commitWork_revertsOnAgentIdAboveAgentCount() public {
        uint256 bountyId = _createBounty();
        bytes32 commitHash = _commitHash(bountyId, 4, keccak256("img"), "ipfs://meta", keccak256("salt"));

        vm.prank(executor);
        vm.expectRevert(bytes("BountyMint: invalid agent"));
        bounty.commitWork(bountyId, 4, commitHash, agent1Payout);
    }

    function test_commitWork_succeedsOnAgentIdThree() public {
        uint256 bountyId = _createBounty();
        bytes32 commitHash = _commitHash(bountyId, 3, keccak256("img"), "ipfs://meta", keccak256("salt"));

        vm.prank(executor);
        bounty.commitWork(bountyId, 3, commitHash, agent3Payout);

        (bytes32 storedHash,,,,) = bounty.submissions(bountyId, 3);
        assertEq(storedHash, commitHash);
    }

    function test_commitWork_revertsAfterDeadline() public {
        uint256 bountyId = _createBounty();
        (,,, uint64 deadline,,,,,) = bounty.bounties(bountyId);
        vm.warp(deadline + 1);

        bytes32 commitHash = _commitHash(bountyId, 1, keccak256("img"), "ipfs://meta", keccak256("salt"));
        vm.prank(executor);
        vm.expectRevert(bytes("BountyMint: bounty expired"));
        bounty.commitWork(bountyId, 1, commitHash, agent1Payout);
    }

    /* ---------------------------------------------------------------- */
    /* revealWork                                                         */
    /* ---------------------------------------------------------------- */

    function test_revealWork_revertsAfterDeadline() public {
        uint256 bountyId = _createBounty();
        bytes32 imageHash = keccak256("img");
        string memory uri = "ipfs://meta";
        bytes32 salt = keccak256("salt");

        vm.startPrank(executor);
        bounty.commitWork(bountyId, 1, _commitHash(bountyId, 1, imageHash, uri, salt), agent1Payout);
        bounty.commitWork(bountyId, 2, _commitHash(bountyId, 2, imageHash, uri, salt), agent2Payout);
        bounty.commitWork(bountyId, 3, _commitHash(bountyId, 3, imageHash, uri, salt), agent3Payout);

        (,,, uint64 deadline,,,,,) = bounty.bounties(bountyId);
        vm.warp(deadline + 1);

        vm.expectRevert(bytes("BountyMint: bounty expired"));
        bounty.revealWork(bountyId, 1, imageHash, uri, salt);
        vm.stopPrank();
    }

    function test_revealWork_revertsForNonExecutor() public {
        uint256 bountyId = _createBounty();
        bytes32 imageHash = keccak256("img");
        string memory uri = "ipfs://meta";
        bytes32 salt = keccak256("salt");

        vm.startPrank(executor);
        bounty.commitWork(bountyId, 1, _commitHash(bountyId, 1, imageHash, uri, salt), agent1Payout);
        bounty.commitWork(bountyId, 2, _commitHash(bountyId, 2, imageHash, uri, salt), agent2Payout);
        bounty.commitWork(bountyId, 3, _commitHash(bountyId, 3, imageHash, uri, salt), agent3Payout);
        vm.stopPrank();

        vm.prank(creator);
        vm.expectRevert(bytes("BountyMint: not executor"));
        bounty.revealWork(bountyId, 1, imageHash, uri, salt);
    }

    function test_revealWork_revertsOnDuplicateReveal() public {
        uint256 bountyId = _createBounty();
        bytes32 imageHash = keccak256("img");
        string memory uri = "ipfs://meta";
        bytes32 salt = keccak256("salt");

        vm.startPrank(executor);
        bounty.commitWork(bountyId, 1, _commitHash(bountyId, 1, imageHash, uri, salt), agent1Payout);
        bounty.commitWork(bountyId, 2, _commitHash(bountyId, 2, imageHash, uri, salt), agent2Payout);
        bounty.commitWork(bountyId, 3, _commitHash(bountyId, 3, imageHash, uri, salt), agent3Payout);

        bounty.revealWork(bountyId, 1, imageHash, uri, salt);

        vm.expectRevert(bytes("BountyMint: already revealed"));
        bounty.revealWork(bountyId, 1, imageHash, uri, salt);
        vm.stopPrank();
    }

    function test_revealWork_revertsOnMismatchedSalt() public {
        uint256 bountyId = _createBounty();
        bytes32 imageHash = keccak256("img");
        string memory uri = "ipfs://meta";
        bytes32 salt = keccak256("salt");
        bytes32 commitHash = _commitHash(bountyId, 1, imageHash, uri, salt);

        vm.startPrank(executor);
        bounty.commitWork(bountyId, 1, commitHash, agent1Payout);
        bounty.commitWork(bountyId, 2, _commitHash(bountyId, 2, imageHash, uri, salt), agent2Payout);
        bounty.commitWork(bountyId, 3, _commitHash(bountyId, 3, imageHash, uri, salt), agent3Payout);

        vm.expectRevert(bytes("BountyMint: commit mismatch"));
        bounty.revealWork(bountyId, 1, imageHash, uri, keccak256("wrong-salt"));
        vm.stopPrank();
    }

    function test_revealWork_revertsWhenCommitsIncomplete() public {
        uint256 bountyId = _createBounty();
        bytes32 imageHash = keccak256("img");
        string memory uri = "ipfs://meta";
        bytes32 salt = keccak256("salt");
        bytes32 commitHash = _commitHash(bountyId, 1, imageHash, uri, salt);

        vm.startPrank(executor);
        bounty.commitWork(bountyId, 1, commitHash, agent1Payout);
        vm.expectRevert(bytes("BountyMint: commits incomplete"));
        bounty.revealWork(bountyId, 1, imageHash, uri, salt);
        vm.stopPrank();
    }

    function test_revealWork_revertsOnAgentIdZero() public {
        uint256 bountyId = _createBounty();
        _commitAndRevealAll(bountyId);

        vm.prank(executor);
        vm.expectRevert(bytes("BountyMint: invalid agent"));
        bounty.revealWork(bountyId, 0, keccak256("img"), "ipfs://meta", keccak256("salt"));
    }

    function test_revealWork_allThreeSucceedAndSetsRevealedStatus() public {
        uint256 bountyId = _createBounty();
        _commitAndRevealAll(bountyId);

        (,,,, BountyMint.BountyStatus status,, uint8 revealCount,,) = bounty.bounties(bountyId);
        assertEq(uint8(status), uint8(BountyMint.BountyStatus.Revealed));
        assertEq(revealCount, 3);
    }

    /* ---------------------------------------------------------------- */
    /* awardWinner                                                        */
    /* ---------------------------------------------------------------- */

    function test_awardWinner_paysWinnerAndMintsNft() public {
        uint256 bountyId = _createBounty();
        _commitAndRevealAll(bountyId);

        uint256 balanceBefore = agent2Payout.balance;

        vm.prank(creator);
        bounty.awardWinner(bountyId, 2);

        assertEq(agent2Payout.balance, balanceBefore + REWARD);
        assertEq(bounty.ownerOf(0), creator);

        (,,,, BountyMint.BountyStatus status,,, uint8 winningAgentId, uint256 tokenId) = bounty.bounties(bountyId);
        assertEq(uint8(status), uint8(BountyMint.BountyStatus.Awarded));
        assertEq(winningAgentId, 2);
        assertEq(tokenId, 0);
    }

    function test_awardWinner_onlyCreator() public {
        uint256 bountyId = _createBounty();
        _commitAndRevealAll(bountyId);

        vm.prank(executor);
        vm.expectRevert(bytes("BountyMint: not creator"));
        bounty.awardWinner(bountyId, 1);
    }

    function test_awardWinner_revertsIfNotRevealed() public {
        uint256 bountyId = _createBounty();

        vm.prank(creator);
        vm.expectRevert(bytes("BountyMint: not revealed"));
        bounty.awardWinner(bountyId, 1);
    }

    function test_awardWinner_cannotBeCalledTwice() public {
        uint256 bountyId = _createBounty();
        _commitAndRevealAll(bountyId);

        vm.prank(creator);
        bounty.awardWinner(bountyId, 1);

        vm.prank(creator);
        vm.expectRevert(bytes("BountyMint: not revealed"));
        bounty.awardWinner(bountyId, 1);
    }

    function test_awardWinner_revertsOnAgentIdAboveAgentCount() public {
        uint256 bountyId = _createBounty();
        _commitAndRevealAll(bountyId);

        vm.prank(creator);
        vm.expectRevert(bytes("BountyMint: invalid agent"));
        bounty.awardWinner(bountyId, 4);
    }

    function test_awardWinner_blocksReentrancy() public {
        uint256 bountyId = _createBounty();

        ReentrancyGuardHelper helper = new ReentrancyGuardHelper(bounty);
        bytes32 imageHash = keccak256("img");
        string memory uri = "ipfs://meta";
        bytes32 salt = keccak256("salt");

        vm.startPrank(executor);
        bounty.commitWork(
            bountyId, 1, _commitHash(bountyId, 1, imageHash, uri, salt), address(helper.attacker())
        );
        bounty.commitWork(bountyId, 2, _commitHash(bountyId, 2, imageHash, uri, salt), agent2Payout);
        bounty.commitWork(bountyId, 3, _commitHash(bountyId, 3, imageHash, uri, salt), agent3Payout);

        bounty.revealWork(bountyId, 1, imageHash, uri, salt);
        bounty.revealWork(bountyId, 2, imageHash, uri, salt);
        bounty.revealWork(bountyId, 3, imageHash, uri, salt);
        vm.stopPrank();

        helper.attacker().setTarget(bountyId, 1);

        vm.prank(creator);
        vm.expectRevert();
        bounty.awardWinner(bountyId, 1);
    }

    /* ---------------------------------------------------------------- */
    /* refundExpiredBounty                                                */
    /* ---------------------------------------------------------------- */

    function test_refund_revertsBeforeDeadline() public {
        uint256 bountyId = _createBounty();

        vm.prank(creator);
        vm.expectRevert(bytes("BountyMint: not expired"));
        bounty.refundExpiredBounty(bountyId);
    }

    function test_refund_succeedsAfterDeadline() public {
        uint256 bountyId = _createBounty();
        (,,, uint64 deadline,,,,,) = bounty.bounties(bountyId);
        vm.warp(deadline + 1);

        uint256 balanceBefore = creator.balance;
        vm.prank(creator);
        bounty.refundExpiredBounty(bountyId);

        assertEq(creator.balance, balanceBefore + REWARD);
        (,,,, BountyMint.BountyStatus status,,,,) = bounty.bounties(bountyId);
        assertEq(uint8(status), uint8(BountyMint.BountyStatus.Cancelled));
    }

    function test_refund_revertsIfAlreadyAwarded() public {
        uint256 bountyId = _createBounty();
        _commitAndRevealAll(bountyId);

        vm.prank(creator);
        bounty.awardWinner(bountyId, 1);

        (,,, uint64 deadline,,,,,) = bounty.bounties(bountyId);
        vm.warp(deadline + 1);

        vm.prank(creator);
        vm.expectRevert(bytes("BountyMint: cannot refund"));
        bounty.refundExpiredBounty(bountyId);
    }
}

/// @dev Deploys a reentrant payout attacker for a fresh BountyMint instance under test,
/// isolated so BountyMintTest doesn't need to inherit attacker wiring directly.
contract ReentrancyGuardHelper {
    ReentrantPayoutAttacker public attacker;

    constructor(BountyMint target) {
        attacker = new ReentrantPayoutAttacker(target);
    }
}
