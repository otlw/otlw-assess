import ToggleButton from 'react-toggle-button'
import h from 'react-hyperscript'
import styled from 'styled-components'

export const AssessmentList = (props) => {
  return (
    h(listContainer, [
      // show toggle button if it's the available list
      (props.name === 'Available'
        ? h(availableHeader, [
          h('h1', props.name),
          h(styledToggleWrapper, [
            h(styledToggleLabel, {active: props.showHidden}, 'Show Hidden'),
            h(ToggleButton, {value: props.showHidden, onToggle: props.toggleHidden})
          ])
        ])
        : h('h1', props.name)),
      // show assessments or string 'None'
      (props.assessments.length === 0
       ? 'None'
       : h(listContainerCards, props.assessments.map((assessment, k) => {
         return h(props.assessmentCard, {
           assessment,
           userAddress: props.userAddress,
           networkID: props.networkID
         })
       }))
      )
    ])
  )
}

const assessmentListStyle = {
  frame: {
    padding: '1em',
    border: '0.5px solid lightgrey'
  }
}

const listContainer = styled('div').attrs({className: 'flex flex-column w-100'})``

const listContainerCards = styled('div').attrs({className: 'flex flex-row flex-wrap w-100 justify-center'})``

const styledToggleWrapper = styled('div')`
  display: flex;
  justify-content: space-evenly;
  align-items: baseline;
  width: 200px;
`
const styledToggleLabel = styled('h4')`
  color: ${props => props.active ? 'green' : '#8c8c8c'}
`

const availableHeader = styled('div')`
  display: flex;
  justify-content: space-between;
`
export default AssessmentList
