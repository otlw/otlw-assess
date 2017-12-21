pragma solidity ^0.4.11;

import "./ConceptRegistry.sol";
import "./Assessment.sol";
import "./FathomToken.sol";

contract Minter {
    uint reward;

    uint epochTime;
    bytes32 epochHash;
    uint epochLength;

    FathomToken fathomToken;
    ConceptRegistry conceptRegistry;

    address winner;
    uint closestDistance;

    address owner;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function Minter(address _fathomToken, address _conceptRegistry, uint _epochLength, uint _reward) public {
        fathomToken = FathomToken(_fathomToken);
        conceptRegistry = ConceptRegistry(_conceptRegistry);
        epochLength = _epochLength;
        epochTime = now;
        epochHash = block.blockhash(block.number - 1);
        reward = _reward;
        owner = msg.sender;
    }

    function submitBid (address _assessor, address _assessment, uint _tokenSalt) public {
        Assessment assessment = Assessment(_assessment);
        require(conceptRegistry.conceptExists(assessment.concept()) &&
                Concept(assessment.concept()).assessmentExists(_assessment) &&
                assessment.endTime() < epochTime + epochLength &&
                uint(assessment.assessmentStage()) == 4 &&
                uint(assessment.assessorState(_assessor)) == 4 &&
                _tokenSalt <= assessment.cost());

        bytes32 hash = keccak256(_assessor, assessment, _tokenSalt, assessment.salt());
        if(uint(epochHash) - uint(hash) < closestDistance){
            closestDistance = uint(epochHash) - uint(hash);
            winner = _assessor;
        }
    }

    function endEpoch() public {
        if(now > (epochTime + epochLength)){
            if(fathomToken.mint(winner, reward)){
                epochTime = now;
                epochHash = block.blockhash(block.number -1);
            }
        }
    }

    function setOwner(address _owner) public onlyOwner() {
        owner = _owner;
    }

    function setReward(uint _reward) public onlyOwner() {
        reward = _reward;
    }

    function setEpochLength (uint _length) public onlyOwner() {
        epochLength = _length;
    }
}


