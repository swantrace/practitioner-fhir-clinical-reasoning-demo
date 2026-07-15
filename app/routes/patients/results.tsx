import { createRoute } from 'honox/factory';
import { PatientTable } from '../../components/patient-table';
import { listPatients } from '../../fhir/patient';

export default createRoute(async (c) => {
  const query = c.req.query('name')?.trim();
  const patients = await listPatients(query);

  return c.html(
    patients.ok ? (
      <PatientTable patients={patients.data} />
    ) : (
      <PatientTable error={patients.message} />
    ),
  );
});
