import { Component } from 'react'
import AssessmentData from './AssessmentData'
var h = require('react-hyperscript')

export class AssessmentView extends Component {
  componentWillMount () {
    this.props.setAssessment(this.props.match.params.id)
  }

  componentWillUnmount () {
    this.props.resetLoadedDetails()
    this.props.setAssessment('')
  }

  render () {
    if (this.props.selectedAssessment) {
      return (
        h('div', [
          h(AssessmentData)
        ])
      )
    } else {
      return h('div', 'Fetching address from url')
    }
  }
}

export default AssessmentView