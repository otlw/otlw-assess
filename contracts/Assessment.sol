pragma solidity ^0.4.11;

import "./Math.sol";
import "./Concept.sol";
import "./FathomToken.sol";

contract Assessment {
    address assessee;
    address[] assessors;

    mapping (address => State) assessorState;
    State public assessmentStage;
    enum State {
        None,
        Called,
        Confirmed,
        Committed,
        Done,
        Burned
    }

    address concept;
    address fathomToken;

    uint public endTime;
    // will keep track of timelimits for 1) latest possible time to confirm and
    // 2) earliest time to reveal
    uint public checkpoint;
    uint public size;
    uint cost;

    mapping(address => bytes32) commits;
    uint public done; //counter how many assessors have committed/revealed their score
    mapping(address => int128) scores;
    int public finalScore;

    modifier onlyConcept() {
        require(msg.sender == concept);
        _;
    }

    modifier onlyInStage(State _stage) {
        require(assessmentStage == _stage);
        _;
    }

    function Assessment(address _assessee,
                        uint _size,
                        uint _cost,
                        uint _confirmTime,
                        uint _timeLimit) {
        assessee = _assessee;
        concept = msg.sender;
        fathomToken = Concept(concept).fathomToken();

        endTime = now + _timeLimit;
        // set checkpoint to latest possible time to confirm
        checkpoint = now + _confirmTime;
        assert(checkpoint < endTime);

        size = _size;
        cost = _cost;

        FathomToken(fathomToken).notification(assessee, 0); // assesse has started an assessment
        done = 0;
    }

    function cancelAssessment() private {
        FathomToken(fathomToken).transfer(assessee, cost*size);
        FathomToken(fathomToken).notification(assessee, 3); //Assessment Cancled and you have been refunded
        for (uint i = 0; i < assessors.length; i++) {
            if (assessorState[assessors[i]] != State.Burned) {
                FathomToken(fathomToken).transfer(assessors[i], cost);
                FathomToken(fathomToken).notification(assessors[i], 3); //Assessment Cancled and you have been refunded
            }
        }
        suicide(concept);
    }

    //@purpose: adds a user to the pool eligible to accept an assessment
    function addAssessorToPool(address assessor) onlyConcept() returns(bool) {
        if (assessor != assessee && assessorState[assessor] == State.None) {
            FathomToken(fathomToken).notification(assessor, 1); //Called As A Potential Assessor
            assessorState[assessor] = State.Called;
            return true;
        }
        else {
            return false;
        }
    }

    /*
      @purpose: To recursively set the pool to draw assessors from in the assessment
      stops when the pool of potential assessors is 20 times the size of the assessment2
      @param: uint seed = the seed number for random number generation
      @param: address _concept = the concept being called from
      @param: uint num = the total number of assessors to be called
    */
    function setAssessorPool(uint seed, address _concept, uint num) onlyConcept() {
        uint numCalled = 0;
        uint membersOfConcept = Concept(_concept).getMemberLength();
        //we want to call at most half of the members of each concept
        uint maxFromThisPool = num > membersOfConcept/2 ? membersOfConcept/2 : num;
        for (uint k=0; k < maxFromThisPool; k++) {
            address randomUser = Concept(_concept).getWeightedRandomMember(seed + k);
            if (randomUser != address(0x0) && addAssessorToPool(randomUser)) {
                numCalled++;
            }
        }
        uint remaining = num - numCalled;
        if (remaining > 0) {
            for (uint i = 0; i < Concept(_concept).getParentsLength(); i++) {
                setAssessorPool(seed + numCalled + i, Concept(_concept).parents(i), remaining/Concept(_concept).getParentsLength() + 1); //Calls the remaining users from the parent concepts proportional to their size
            }
        }
        assessmentStage = State.Called;
    }

    //@purpose: called by an assessor to confirm and stake
    function confirmAssessor() onlyInStage(State.Called) {
        // cancel if the assessment is older than 12 hours or already past its timelimit
        if (now > checkpoint){
            cancelAssessment();
            return;
        }
        if (assessorState[msg.sender] == State.Called &&
            assessors.length < size &&
            FathomToken(fathomToken).takeBalance(msg.sender, address(this), cost, concept)
            ) {
            assessors.push(msg.sender);
            assessorState[msg.sender] = State.Confirmed;
            FathomToken(fathomToken).notification(msg.sender, 2); //Confirmed for assessing, stake has been taken
        }
        if (assessors.length == size) {
            notifyAssessors(uint(State.Confirmed), 4);
            FathomToken(fathomToken).notification(assessee, 4);
            assessmentStage = State.Confirmed;
        }
    }

    //@purpose: called by an assessor to commit a hash of their score //TODO explain in more detail what's happening
    function commit(bytes32 _hash) onlyInStage(State.Confirmed) {
        if (now > endTime) {
            burnStakes();
        }
        if (assessorState[msg.sender] == State.Confirmed) {
                commits[msg.sender] = _hash;
                assessorState[msg.sender] = State.Committed;
                done++; //Increases done by 1 to help progress to the next assessment stage.
        }
        if (done == size) {
            //set checkpoint to end of 12 hour challenge period after which scores can be revealed
            checkpoint = now + 12 hours;
            notifyAssessors(uint(State.Committed), 5);
            done = 0; //Resets the done counter
            assessmentStage = State.Committed;
        }
    }


    function steal(int128 _score, string _salt, address assessor) {
        if(assessorState[assessor] == State.Committed) {
            if(commits[assessor] == sha3(_score, _salt)) {
                FathomToken(fathomToken).transfer(msg.sender, cost/2);
                assessorState[assessor] = State.Burned;
                size--;
            }
        }
    }

    //@purpose: called by assessors to reveal their own commits or others
    // must be called between 12 hours after the latest commit and 24 hours after the
    // end of the assessment. If the last commit happens during at the last possible
    // point in time (right before endtime), this period will be 12hours
    function reveal(int128 _score, string _salt) onlyInStage(State.Committed) {
        // scores can only be revealed after the challenge period has passed
        require(now > checkpoint);
        // If the time to reveal has passed, burn all unrevealed assessors
        if (now > endTime + 24 hours) {
            for (uint i = 0; i < assessors.length; i++) {
                if (assessorState[assessors[i]] == State.Committed) {
                    burnAssessor(address(0x0), i);
                }
            }
        }

        if(assessorState[msg.sender] == State.Committed &&
           commits[msg.sender] == sha3(_score, _salt)) {
                    scores[msg.sender] = _score;
                    assessorState[msg.sender] = State.Done;
                    done++;
        }

        if (done == size) {
            assessmentStage = State.Done;
            calculateResult();
        }
    }

    //@purpose: burns stakes of all assessors who are committed
    function burnStakes() private {
        for (uint i = 0; i < assessors.length; i++) {
            if (assessorState[assessors[i]] == State.Confirmed) {
                burnAssessor(address(0x0), i);
           }
        }
    }

    /* @purpose: mark an assessor as burned, reduce size and cancel assessment
      if the size is below five.
      @param _assessor address of the assessor to be burned
      @param _idx index of the assessor in the assessor array (only used if the assessor address is zero)
    */
    function burnAssessor(address _assessor, uint _idx) private {
        assessorState[_assessor != address(0x0) ? _assessor : assessors[_idx]] = State.Burned;
        if (--size < 5) {
            cancelAssessment();
        }
    }

    function notifyAssessors(uint _state, uint _topic) private {
        for (uint i=0; i < assessors.length; i++) {
            if (uint(assessorState[assessors[i]]) == _state) {
                FathomToken(fathomToken).notification(assessors[i], _topic);
            }
        }
    }

    function calculateResult() onlyInStage(State.Done) private {
        int[] memory finalScores = new int[] (done);
        uint idx =0;
        for (uint j = 0; j < assessors.length; j++) {
            if (assessorState[assessors[j]] == State.Done) {
                finalScores[idx] = scores[assessors[j]];
                idx++;
            }
        }
        uint mad = Math.calculateMAD(finalScores);
        uint finalClusterLength;
        (finalScore, finalClusterLength) = Math.getFinalScore(finalScores, mad);
        payout(mad);
        if (finalScore > 0) {
            Concept(concept).addMember(assessee, uint(finalScore) * finalClusterLength);
        }
        FathomToken(fathomToken).notification(assessee, 7);
   }

    function payout(uint mad) onlyInStage(State.Done) private {
        uint q = 1; //INFLATION RATE
        for (uint i = 0; i < assessors.length; i++) {
            if (assessorState[assessors[i]] == State.Done) {
                uint payoutValue = Math.getPayout(Math.abs(scores[assessors[i]] - finalScore), mad, cost, q);
                FathomToken(fathomToken).transfer(assessors[i], payoutValue);
                FathomToken(fathomToken).notification(assessors[i], 6); //You  got paid!
            }
        }
    }
}
