library HypertensionBpFollowup version '1.0.0'

using FHIR version '4.0.1'

context Patient

define "BloodPressureDocumentationMissing":
  "HasActiveHypertension" and not "HasBloodPressureObservation"

define "HasActiveHypertension":
  exists ([Condition] C
    where C.clinicalStatus.coding.code contains 'active'
      and Lower(C.code.text.value) contains 'hypertension')

define "HasBloodPressureObservation":
  exists ([Observation] O
    where O.status.value in { 'final', 'amended', 'corrected' }
      and (
        O.code.coding.code contains '85354-9'
          or Lower(O.code.text.value) contains 'blood pressure'
      ))
