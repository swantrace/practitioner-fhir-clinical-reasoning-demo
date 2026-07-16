library HypertensionBpFollowup version '1.0.0'

using FHIR version '4.0.1'

context Patient

define "BloodPressureDocumentationMissing":
  "HasActiveHypertension" and not "HasBloodPressureObservation"

define "HasActiveHypertension":
  exists ([Condition] C
    where C.clinicalStatus.coding.code.value contains 'active'
      and exists (C.code.coding Coding
        where Coding.system.value = 'http://snomed.info/sct'
          and Coding.code.value = '38341003'))

define "HasBloodPressureObservation":
  exists ([Observation] O
    where O.status.value in { 'final', 'amended', 'corrected' }
      and exists (O.code.coding Coding
        where Coding.system.value = 'http://loinc.org'
          and Coding.code.value = '85354-9'))
