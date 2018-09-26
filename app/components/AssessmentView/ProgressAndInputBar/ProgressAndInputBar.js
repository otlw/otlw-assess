import { Component } from 'react'
import h from 'react-hyperscript'
import { Stage, StageDisplayNames } from '../../../constants.js'
import { convertFromUIScoreToOnChainScore } from '../../../utils.js'
import styled from 'styled-components'
import icoClose from '../../../assets/ico-close.svg'

// component to display an individual assessor slot address and options
export class ProgressAndInputBar extends Component {
  constructor (props) {
    super(props)

    // get cache/localStorage data in case a score-salt has been commited
    let cacheCommitData = JSON.parse(window.localStorage.getItem(this.props.assessmentAddress + this.props.userAddress))

    // state contains local variables that would rerender the component
    // state is set to default score-salt only if the cache is empty for that assessment address
    if (cacheCommitData) {
      this.state = {
        view: this.props.inputType || 'stageView',
        score: Number(cacheCommitData.score),
        salt: cacheCommitData.salt,
        invalidScoreRange: false
      }
    } else {
      this.state = {
        view: 'stageView',
        score: 0,
        salt: 'hihi',
        invalidScoreRange: false
      }
    }
  }

  setStakeAction () {
    this.setState({
      view: 'Stake',
      displayText: 'Please confirm your stake of ' + this.props.cost + ' AHA to join the assessment.',
      action: this.stake
    })
  }

  setCommitAction () {
    this.setState({
      view: 'Commit',
      displayText: 'Please input your score and confirm.',
      action: this.commit
    })
  }

  setRevealAction () {
    this.setState({
      view: 'Reveal',
      displayText: 'Click the button to reveal your score.',
      action: this.reveal
    })
  }

  setProgressView () {
    this.setState({
      view: 'stageView'
    })
  }

  stake () {
    this.props.confirmAssessor(this.props.assessmentAddress)
    this.setProgressView()
  }

  commit () {
    // commit score+salt (salt is fixed for now)
    window.alert('Please write down your salt:' + this.state.salt)
    // convert score to onChain score (FE:0-100, BE: -100,100)
    let onChainScore = convertFromUIScoreToOnChainScore(this.state.score)
    this.props.commit(this.props.assessmentAddress, onChainScore, this.state.salt)
    // save salt and score in local storage
    let cacheCommitData = JSON.stringify({score: this.state.score, salt: this.state.salt})
    window.localStorage.setItem(this.props.assessmentAddress + this.props.userAddress, cacheCommitData)
    this.setProgressView()
  }

  reveal () {
    console.log('reveal', this.props.assessmentAddress, this.state.score, this.state.salt)
    // convert score to onChain score (FE:0-100, BE: -100,100)
    let onChainScore = convertFromUIScoreToOnChainScore(this.state.score)
    this.props.reveal(this.props.assessmentAddress, onChainScore, this.state.salt)
    this.setProgressView()
  }

  setScore (e) {
    // make sure number is a multiple of 0.5%
    let score = (Math.floor((Number(e.target.value)) * 2)) / 2
    if (score >= 0 && score <= 100 && (((Number(e.target.value)) * 10) % 5) === 0) {
      this.setState({score: score, invalidScoreRange: false})
    } else {
      this.setState({invalidScoreRange: true})
    }
  }

  closeInputBar () {
    if (this.props.inputType) this.props.setInputBar('')
    else this.setProgressView()
  }

  stageFunctions (stage) {
    let stageFunctions = {
      [Stage.Called]: this.setStakeAction.bind(this),
      [Stage.Confirmed]: this.setCommitAction.bind(this),
      [Stage.Committed]: this.setRevealAction.bind(this)
    }
    return stageFunctions(stage)
  }

  // helper function to return the right kind of actionBar
  actionBar (assessmentStage) {
    let stageTexts = {
      [Stage.Called]: 'Click "Stake" to join the assessment.',
      [Stage.Confirmed]: 'Please "Commit" your score within X hours/days', // TODO actually calculate difference between now and assessment.checkpoint
      [Stage.Committed]: 'Please click "Reveal" to reveal your score and complete the assessment.'
    }
    let stageFunctions = {
      [Stage.Called]: this.setStakeAction.bind(this),
      [Stage.Confirmed]: this.setCommitAction.bind(this),
      [Stage.Committed]: this.setRevealAction.bind(this)
    }
    return (
      // ALEX work your magic here!
      h('div', [
        h('span', stageTexts[assessmentStage]),
        h(containerProgressButton, [
          h(buttonProgressActive, {
            onClick: stageFunctions[assessmentStage]
          }, StageDisplayNames[assessmentStage])
        ])
      ])
    )
  }

  render () {
    let view = this.props.inputType || this.state.view
    let activeUser = this.props.userStage === this.props.stage
    switch (view) {
      case 'stageView': {
        // show overview with differently colored Buttons that indicate the activity of the stage
        // and the general progress of the assessment
        return (
          h(containerProgressBar, [
            activeUser ? this.actionBar(this.props.stage)
              : [h('div', 'Waiting for other assessors...')] // ALEX: Or maybe we don't display anything, as the text is already up in the statusBox
          ])
        )
      }
      case 'Stake':
      case 'Commit':
      case 'Reveal': {
        // show actionView, where the user can input data and interact with the assessment
        return (
          h(containerProgressBar, [
            h(buttonClose, {onClick: this.closeInputBar.bind(this)}, [
              h('img', {alt: 'icoClose', src: icoClose})
            ]),
            h(rowObjectText, [
              h(StageDescriptor, this.state.displayText),
              (this.props.stage === Stage.Confirmed
                ? (
                  h(rowObjectInput, [
                    h(inputProgressBar, {
                      placeholder: 'Input your score here, from 0 to 100',
                      step: 0.5,
                      type: 'number',
                      onChange: this.setScore.bind(this)})
                  ])
                )
                : null
              )
            ]),
            h(buttonSubmit, {onClick: this.state.action.bind(this)}, view)
          ])
        )
      }
      default:
        console.log('ERROR: invalid view type', this.state.view)
        return h('div', 'Ooopsi, something went wrong here!')
    }
  }
}

export default ProgressAndInputBar

export const containerProgressBar = styled('div').attrs({className: 'flex flex-row w-100 h3 items-center bt b--light-gray'})`
`

export const buttonClose = styled('button').attrs({className: 'flex h-100 items-center justify-center ph4 br b--light-gray pointer'})`
transition:0.2s ease-in-out;
border-top: 0px;
border-left: 0px;
border-bottom: 0px;
:hover {background-color:#eee;}
`
export const ProgressButton = styled('button')`
  padding: 0.25em 1em;
  border: 2px solid palevioletred;
`

export const containerProgressButton = styled('div').attrs({className: 'flex w-100 items-center justify-center pv3  '})`
`

export const buttonProgressPast = styled('button').attrs({className: 'flex pv2 ph3 items-center justify-center br-pill bn ttu uppercase pointer'})`
color: #EAF7FD;
background-color: hsla(155, 70%, 40%, 1);
`

export const buttonProgressActive = styled('button').attrs({className: 'flex pv2 ph3 items-center justify-center br-pill bn ttu uppercase pointer'})`
color: #EAF7FD;
background-color: #0A4A66;
`

export const buttonProgressInactive = styled('button').attrs({className: 'flex pv2 ph3 items-center justify-center br-pill bn ttu uppercase pointer'})`
color: #EAF7FD;
background-color: hsla(155, 70%, 40%, 1);
`

export const buttonProgressFuture = styled('button').attrs({className: 'flex pv2 ph3 items-center justify-center br-pill ba ttu uppercase pointer'})`
  color: #0A4A66;
  background: transparent;
  border-color: #0A4A66;
  opacity: 0.25;
`
// TODO need to rename to progressBarTextDescription
export const StageDescriptor = styled('div').attrs({className: 'flex w-100 items-center justify-center f5 gray pv3'})`
`

export const rowObjectText = styled('div').attrs({className: 'flex w-100 items-center justify-between br b--light-gray f5 gray ttu uppercase'})`;
`

export const rowObjectInput = styled('div').attrs({className: 'flex w-100 h-100 items-center justify-end pv2 b--light-gray  f5 gray ttu uppercase'})`;
`

export const buttonSubmit = styled('button').attrs({className: 'flex h3 items-center justify-center pv3 bn ph4 bg-light-green pointer ttu uppercase f5 '})`
transition:0.2s ease-in-out;
:hover {background-color:hsla(158, 46%, 57%, 1);}
`

export const Feedback = styled.div`
  font-size: 0.7em;
  font-style: italic;
  color:${props => props.invalidScoreRange ? 'red' : 'lightgrey'};
`

export const inputProgressBar = styled('input').attrs({className: 'flex w-80 h3 pv0 pl3 bg-light-gray bn '})`
outline: none;
`
