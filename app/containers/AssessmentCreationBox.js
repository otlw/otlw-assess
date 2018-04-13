import { connect } from 'react-redux'
import AssessmentCreationBar from '../components/AssessmentCreationBar'
import { loadConceptContractAndCreateAssessment } from '../actions/conceptActions.js'

const mapStateToProps = state => {
  return {
    conceptList: state.conceptList
  }
}

const mapDispatchToProps = {
  loadConceptContractAndCreateAssessment
}

export default connect(mapStateToProps, mapDispatchToProps)(AssessmentCreationBar)
