import { Component } from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import h from 'react-hyperscript'
import {Headline, Label, Body} from '../Global/Text.ts'
import {toggleAvailability} from '../../store/concept/asyncActions.js'

export class ConceptCard extends Component {

  toggleAvailabilityAsAssessor(e) {
    console.log('e', e.target.id)
    this.props.toggleAvailability(e.target.id)
  }

  render () {
    // NOTE once the concept definition process is more defined we will want to
    // use the learnMore field that the ipfs description of a concept provides

    // set LearnMore link if it's provided by the concept data
    // let LearnMore = null
    // if (this.props.conceptData.learnMore) {
    //   LearnMore = h(cardButtonSecondary, {href: this.props.conceptData.learnMore, target: '_blank'}, 'Learn')
    // }

    return h(cardContainer, [
      h(cardContainerInfo, [
        h(cardTextObject, [
          h(Label, 'Concept'),
          h(Headline, this.props.conceptData.name)
        ])
      ]),
      h(cardContainerDescription, [
        h(cardObjectDescription, [
          h(Body, this.props.conceptData.description)
        ]),
        h(cardContainerButtons, [
          this.props.conceptData.userIsMember
            ? h(cardButtonPrimary, {
              onClick: this.toggleAvailabilityAsAssessor.bind(this),
              id: this.props.conceptAddress},
                this.props.conceptData.userIsActiveAssessor
                ? 'Stop Assessing'
                : 'Be Assesssor')
          : null,
          h(cardButtonPrimary, {onClick: this.props.selectConcept.bind(this), id: this.props.conceptAddress}, 'Get Assessed')
        ])
      ])
    ])
  }
}

const mapDispatchToProps = {
  toggleAvailability
}

export default connect(null, mapDispatchToProps)(ConceptCard)

// styles

const cardContainer = styled('div').attrs({
  className: 'flex flex-column ma3 br2 shadow-4'
})`height: 420px; width: 300px;background: linear-gradient(180.1deg, #FFFFFF 0.05%, #E9F7FD 52.48%, #CFF9EF 85.98%);
`
const cardContainerInfo = styled('div').attrs({
  className: 'flex justify-between flex-column w-100 pa3'
})`
height: 60%;
`

const cardTextObject = styled('div').attrs({
  className: 'flex flex-column tl'
})`
`

const cardContainerDescription = styled('div').attrs({
  className: 'relative flex content-between flex-column w-100'
})`
height: 40%;
background-color: #D3ECF7;
`

const cardObjectDescription = styled('div').attrs({
  className: 'flex flex-column h-100 pl3 pa3'
})`
`

const cardContainerButtons = styled('div').attrs({className: 'flex flex-row justify-center w-100 pb3 ph3'})`
`

const cardButtonPrimary = styled('button').attrs({
  className: 'flex self-end ph4 pv2 fw4 f5 shadow-4 items-center align-center br-pill bg-dark-blue near-white ttu uppercase'
})`background-color: #116187;text-decoration:none;
`

// const cardButtonSecondary = styled('div').attrs({
//   className: 'flex self-end ph4 pv2 fw4 f5 items-center align-center br-pill dark-blue'
// })`box-shadow: 0px 0px 0px 1px hsla(214, 100%, 31%, 0.1);
// `
