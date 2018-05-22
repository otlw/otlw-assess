import {
  RECEIVE_ASSESSMENT,
  RECEIVE_FINALSCORE,
  RECEIVE_ASSESSMENTSTAGE,
  REMOVE_ASSESSMENT,
  RECEIVE_ASSESSORS,
  RECEIVE_STORED_DATA,
  SET_VALID_ASSESSMENT_FLAG
} from '../actions/assessmentActions'

import extend from 'xtend'

let initialState = {
  selectedAssessment: '',
  validAssessmentViewAddress: false
}
/*
  further assessments are stored like this:

assessmentAddress : {
  cost: 0
  size: 5,
  assessee: 0x...,
  stage: [0,4]
  finalScore: [-127, 127],
  assessors : [
    {
      address,
      stage,
    },
    ...
  ]
  storedData: {
     address: dataString,
     ...
  }
}
 */

function assessments (state = initialState, action) {
  switch (action.type) {
    case RECEIVE_ASSESSMENT: {
      return extend(state, {[action.assessment.address]: action.assessment})
    }
    case RECEIVE_ASSESSMENTSTAGE: {
      let address = action.address
      return {
        ...state,
        [address]: extend(state[address], {stage: action.stage})
      }
    }
    case RECEIVE_FINALSCORE: {
      let address = action.address
      return {
        ...state,
        [address]: extend(state[address], {finalScore: action.finalScore})
      }
    }
    case REMOVE_ASSESSMENT: {
      let newStage = {...state}
      delete newStage[action.address]
      return newStage
    }
    case RECEIVE_ASSESSORS: {
      let address = action.address
      return {
        ...state,
        [address]: extend(state[address], {assessors: action.assessors})
      }
    }
    case RECEIVE_STORED_DATA: {
      let address = action.assessmentAddress
      return {
        ...state,
        [address]: extend(state[address], {data: action.data})
      }
    }
    case SET_VALID_ASSESSMENT_FLAG:
      return {
        ...state,
        validAssessmentViewAddress: action.isValid
      }
    default:
      return state
  }
}

export default assessments
