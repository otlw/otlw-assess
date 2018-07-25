import { Component } from 'react'
import MeetingPointForm from './MeetingPointForm.js'
import TxList from '../../TxList.js'
import styled from 'styled-components'
var h = require('react-hyperscript')

export const ViewMeetingPoint = styled('button')`
  display: inline-block;
  padding: 0.25em 1em;
  border: 2px solid palevioletred;
`

export const EditMeetingPoint = styled('button')`
  display: inline-block;
  padding: 0.25em 1em;
  border: 2px solid palevioletred;
`

class MeetingPointEditBox extends Component {
  constructor (props) {
    super(props)
    this.state = {
      displayMPEdit: false
    }
  }

  storeDataOnAssessment (values) {
    this.props.storeDataOnAssessment(this.props.address, values.data)
    this.setState({displayMPEdit: false})
  }

  toggleMPeditability () {
    this.setState({displayMPEdit: !this.state.displayMPEdit})
  }

  render () {
    return (
      h('div', [
        h(fathomButtonSecondary, {
          onClick: this.toggleMPeditability.bind(this)
        }, 'edit'),
        this.state.displayMPEdit ? h(MeetingPointForm, {onSubmit: this.storeDataOnAssessment.bind(this)}) : null,
        this.props.transactions
          ? h(TxList, {transactions: this.props.transactions})
          : null
      ])
    )
  }
}

const fathomButtonSecondary = styled('button').attrs({className: 'flex self-start ph4 pv2 fw4 f5 items-center align-center br-pill dark-blue'})`
box-shadow: 0px 0px 0px 1px hsla(214, 100%, 31%, 0.1);
cursor:pointer;
`

export default MeetingPointEditBox
