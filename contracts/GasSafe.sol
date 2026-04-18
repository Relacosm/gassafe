// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

// ============================================================
//  GasSafe.sol — Combined SBT + Escrow + Audit Anchor
//  Deployed on Holesky testnet
//  AAEP Protocol Implementation
// ============================================================

contract GasSafe {
    address public owner;
    uint256 public constant SUBSIDY_AMOUNT = 0.001 ether; // mock subsidy

    // ── SBT ──────────────────────────────────────────────
    struct SBT {
        bool exists;
        uint8 vouchersRemaining;
        uint8 riskTier;       // 0=GREEN 1=YELLOW 2=RED
        bytes32 addressHash;
        uint256 issuedAt;
    }
    mapping(address => SBT) public sbts;
    mapping(bytes32 => bool) public usedAddressHashes;

    event SBTIssued(address indexed beneficiary, bytes32 addressHash, uint256 timestamp);

    // ── Escrow ────────────────────────────────────────────
    enum BookingStatus { PENDING, DELIVERED, FAILED, OVERRIDDEN }

    struct Booking {
        address beneficiary;
        uint8 riskTier;
        uint8 fraudScore;
        uint256 amount;
        BookingStatus status;
        bytes32 proofHash;
        uint256 createdAt;
        uint256 settledAt;
        string traceId;     // AAEP trace_id
    }
    mapping(bytes32 => Booking) public bookings;

    event SubsidyLocked(bytes32 indexed bookingId, address beneficiary, uint8 riskTier, string traceId);
    event SubsidyReleased(bytes32 indexed bookingId, bytes32 proofHash, uint256 timestamp);
    event BookingOverridden(bytes32 indexed bookingId, address admin, string reason);

    // ── Audit Anchor (AAEP) ───────────────────────────────
    bytes32[] public merkleRoots;
    event AuditRootAnchored(bytes32 merkleRoot, uint256 dleCount, uint256 timestamp);

    // ─────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ── SBT Functions ─────────────────────────────────────
    function issueSBT(
        address beneficiary,
        bytes32 addressHash,
        bytes32 zkpCommitment  // mock ZKP — just stored for auditability
    ) external onlyOwner {
        require(!sbts[beneficiary].exists, "SBT already exists");
        require(!usedAddressHashes[addressHash], "Address already has SBT");

        sbts[beneficiary] = SBT({
            exists: true,
            vouchersRemaining: 12,
            riskTier: 0,
            addressHash: addressHash,
            issuedAt: block.timestamp
        });
        usedAddressHashes[addressHash] = true;

        emit SBTIssued(beneficiary, addressHash, block.timestamp);
    }

    function getSBT(address user) external view returns (SBT memory) {
        return sbts[user];
    }

    function updateRiskTier(address user, uint8 tier) external onlyOwner {
        require(sbts[user].exists, "No SBT");
        sbts[user].riskTier = tier;
    }

    // ── Escrow Functions ──────────────────────────────────
    function lockSubsidy(
        bytes32 bookingId,
        address beneficiary,
        uint8 riskTier,
        uint8 fraudScore,
        string calldata traceId
    ) external payable onlyOwner {
        require(bookings[bookingId].createdAt == 0, "Booking exists");
        require(sbts[beneficiary].exists, "No SBT");
        require(sbts[beneficiary].vouchersRemaining > 0, "No vouchers");
        require(msg.value == SUBSIDY_AMOUNT, "Wrong amount");

        sbts[beneficiary].vouchersRemaining--;

        bookings[bookingId] = Booking({
            beneficiary: beneficiary,
            riskTier: riskTier,
            fraudScore: fraudScore,
            amount: SUBSIDY_AMOUNT,
            status: BookingStatus.PENDING,
            proofHash: bytes32(0),
            createdAt: block.timestamp,
            settledAt: 0,
            traceId: traceId
        });

        emit SubsidyLocked(bookingId, beneficiary, riskTier, traceId);
    }

    function releaseSubsidy(
        bytes32 bookingId,
        bytes32 proofHash,
        address payable agency
    ) external onlyOwner {
        Booking storage b = bookings[bookingId];
        require(b.status == BookingStatus.PENDING, "Not pending");
        require(proofHash != bytes32(0), "Invalid proof");

        b.status = BookingStatus.DELIVERED;
        b.proofHash = proofHash;
        b.settledAt = block.timestamp;

        agency.transfer(b.amount);
        emit SubsidyReleased(bookingId, proofHash, block.timestamp);
    }

    function overrideBooking(bytes32 bookingId, string calldata reason) external onlyOwner {
        Booking storage b = bookings[bookingId];
        require(b.status == BookingStatus.PENDING, "Not pending");
        b.status = BookingStatus.OVERRIDDEN;
        b.settledAt = block.timestamp;
        emit BookingOverridden(bookingId, msg.sender, reason);
    }

    // ── Audit Anchor ──────────────────────────────────────
    function anchorAuditRoot(bytes32 merkleRoot, uint256 dleCount) external onlyOwner {
        merkleRoots.push(merkleRoot);
        emit AuditRootAnchored(merkleRoot, dleCount, block.timestamp);
    }

    function getLatestAuditRoot() external view returns (bytes32) {
        if (merkleRoots.length == 0) return bytes32(0);
        return merkleRoots[merkleRoots.length - 1];
    }

    // Allow contract to receive ETH
    receive() external payable {}

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
